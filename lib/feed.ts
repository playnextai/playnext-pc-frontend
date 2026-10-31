import type { GameCard, SyncStatus } from "./types.ts";

export interface FeedRowData { id: string; title: string; subtitle?: string; cards: GameCard[] }

/** A game appears once on the whole feed: the first row (in the order given) wins,
 *  and rows left empty are dropped. Input rows are not mutated. */
export function dedupeRows(rows: FeedRowData[]): FeedRowData[] {
  const seen = new Set<number>();
  const out: FeedRowData[] = [];
  for (const row of rows) {
    const cards = row.cards.filter((c) => !seen.has(c.game_id));
    cards.forEach((c) => seen.add(c.game_id));
    if (cards.length) out.push({ ...row, cards });
  }
  return out;
}

/** Cold start = no personalized rows at all. Then the feed shows "popular right now"
 *  plus buttons back into the quiz and manual add paths the person may have skipped. */
export function isColdStart(personalRows: FeedRowData[]): boolean {
  return personalRows.every((r) => r.cards.length === 0);
}

export type SyncBanner = { show: false } | { show: true; tone: "progress" | "problem"; key: "sync.progress" | "sync.failed" };

/** The "still syncing your library" banner. Only shown while a sync is queued/running,
 *  or when it failed (so the person knows why their library looks empty). Returns a text key. */
export function syncBanner(status: SyncStatus | null): SyncBanner {
  switch (status) {
    case "queued":
    case "running":
      return { show: true, tone: "progress", key: "sync.progress" };
    case "failed":
      return { show: true, tone: "problem", key: "sync.failed" };
    default:
      return { show: false };
  }
}

/** Poll while a sync is in progress; stop on every other state. */
export const shouldPollSync = (status: SyncStatus | null) => status === "queued" || status === "running";


/** Budget slider: 0 .. highest price in the database. Until the backend reports that top value
 *  (SettingsView.budget_max_toman) the slider uses this fallback. */
export const DEFAULT_BUDGET_MAX_TOMAN = 5_000_000;
export const BUDGET_STEP_TOMAN = 50_000;

/** Slider position -> stored budget. The top of the slider means "no limit" (null). */
export function budgetFromSlider(position: number, max: number): number | null {
  return position >= max ? null : Math.max(0, Math.round(position));
}

/** Stored budget -> slider position (no limit sits at the top). Out-of-range values are clamped. */
export function sliderFromBudget(budget: number | null, max: number): number {
  return budget === null ? max : Math.min(Math.max(0, budget), max);
}
