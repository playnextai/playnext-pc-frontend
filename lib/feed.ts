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

export type SyncBanner = { show: false } | { show: true; tone: "progress" | "problem"; text: string };

/** The "still syncing your library" banner. Only shown while a sync is queued/running,
 *  or when it failed (so the person knows why their library looks empty). */
export function syncBanner(status: SyncStatus | null): SyncBanner {
  switch (status) {
    case "queued":
    case "running":
      return { show: true, tone: "progress", text: "Syncing your Steam library… picks will get better as it finishes." };
    case "failed":
      return { show: true, tone: "problem", text: "We couldn't sync your Steam library. Make sure game details are public on your Steam profile, then sign in again." };
    default:
      return { show: false };
  }
}

/** Poll while a sync is in progress; stop on every other state. */
export const shouldPollSync = (status: SyncStatus | null) => status === "queued" || status === "running";

export const BUDGET_PRESETS_TOMAN = [100_000, 250_000, 500_000, 1_000_000, 2_000_000];
