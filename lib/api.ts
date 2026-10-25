import type {
  CartView, FeedbackAction, GameCard, GameDetail, GamerDna, LibraryItem, Me, OnboardingStatus,
  OnboardingStep, QuizOption, Region, SearchResult, SettingsView, SyncStatus, WishlistItem,
} from "./types.ts";

// All calls go to same-origin /api/* (rewritten to the backend by next.config.mjs).
// The session cookie rides along automatically; the backend takes the user id
// from it and ignores any client-supplied id.

export class ApiError extends Error {
  status: number;
  code: string;
  body: unknown;
  constructor(status: number, code: string, body: unknown) {
    super(`${status} ${code}`);
    this.status = status;
    this.code = code;
    this.body = body;
  }
  get isUnauthenticated() { return this.status === 401; }
  get isRateLimited() { return this.status === 429; }
  get retryAfterSec(): number | null {
    const b = this.body as { retry_after_sec?: number } | null;
    return b?.retry_after_sec ?? null;
  }
}

type Fetch = typeof fetch;
let fetchImpl: Fetch | undefined; // tests inject a fake
export function setFetch(f: Fetch | undefined) { fetchImpl = f; }

export const API_BASE = "/api";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const f = fetchImpl ?? fetch;
  const res = await f(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }
  if (!res.ok) {
    const code = (data as { detail?: string; error?: string } | null)?.detail
      ?? (data as { error?: string } | null)?.error ?? `http_${res.status}`;
    throw new ApiError(res.status, typeof code === "string" ? code : `http_${res.status}`, data);
  }
  return data as T;
}

const qs = (o: Record<string, string | number | undefined>) => {
  const p = Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return p.length ? `?${p.join("&")}` : "";
};

export const api = {
  // identity (sign-in itself lives on the auth site)
  me: () => request<Me>("GET", "/auth/me"),
  acceptConsent: () => request<{ status: string }>("POST", "/auth/consent", { accept_terms: true }),
  logout: () => request<unknown>("POST", "/auth/logout"),

  // onboarding + settings
  onboardingStatus: () => request<OnboardingStatus>("GET", "/onboarding/status"),
  completeStep: (step: Exclude<OnboardingStep, "region">) =>
    request<OnboardingStatus>("POST", "/onboarding/step", { step }),
  quizOptions: () => request<{ options: QuizOption[] }>("GET", "/onboarding/quiz-options"),
  submitQuiz: (gameIds: number[]) =>
    request<{ status: string; count: number }>("POST", "/onboarding/quiz-submit", { game_ids: gameIds }),
  settings: () => request<SettingsView>("GET", "/settings"),
  updateSettings: (patch: { region?: Region | null; budget_ceiling_toman?: number | null }) =>
    request<SettingsView>("PATCH", "/settings", patch),

  // feed
  recommendations: (kind: "new_game" | "backlog" = "new_game", limit = 20) =>
    request<{ recommendations: GameCard[] }>("GET", `/recommendations${qs({ kind, limit })}`),
  unplayed: (limit = 20) => request<{ items: GameCard[] }>("GET", `/feed/unplayed${qs({ limit })}`),
  deals: (limit = 20) => request<{ items: GameCard[] }>("GET", `/feed/deals${qs({ limit })}`),
  outOfUsual: (limit = 20) => request<{ items: GameCard[] }>("GET", `/feed/out-of-usual${qs({ limit })}`),
  popular: (limit = 20) => request<{ items: GameCard[] }>("GET", `/popular${qs({ limit })}`),
  feedback: (gameId: number, action: FeedbackAction, recommendationId?: number) =>
    request<unknown>("POST", "/feedback", { game_id: gameId, action, recommendation_id: recommendationId }),

  // library / wishlist (search-and-add component)
  searchGames: (q: string) => request<{ results: SearchResult[] }>("GET", `/games/search${qs({ q })}`),
  library: (source: "all" | "synced" | "manual" = "all") =>
    request<{ items: LibraryItem[]; count: number }>("GET", `/library${qs({ source })}`),
  addToLibrary: (gameId: number, playtimeBucket?: string, userRating?: number) =>
    request<unknown>("POST", "/library/add", { game_id: gameId, playtime_bucket: playtimeBucket, user_rating: userRating }),
  removeFromLibrary: (gameId: number) => request<unknown>("DELETE", `/library/${gameId}`),
  cyclePlaytime: (gameId: number) => request<unknown>("POST", `/library/${gameId}/cycle-playtime`),
  syncStatus: () => request<{ status: SyncStatus; last_synced: string | null }>("GET", "/library/sync-status"),
  wishlist: () => request<{ items: WishlistItem[]; count: number; region: Region | null }>("GET", "/wishlist"),
  addToWishlist: (gameId: number) => request<unknown>("POST", "/wishlist/add", { game_id: gameId }),
  removeFromWishlist: (gameId: number) => request<unknown>("DELETE", `/wishlist/${gameId}`),

  // detail, cart, dna
  game: (id: number) => request<GameDetail>("GET", `/games/${id}`),
  cart: () => request<CartView>("GET", "/cart"),
  addToCart: (gameEditionId: number) =>
    request<{ status: string; item_id?: number; price_toman?: number }>("POST", "/cart/add", { game_edition_id: gameEditionId }),
  removeFromCart: (itemId: number) => request<unknown>("DELETE", `/cart/${itemId}`),
  gamerDna: () => request<GamerDna>("GET", "/gamer-dna"),
};
