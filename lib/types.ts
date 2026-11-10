// Response shapes of the PlayNext:PC backend. Source of truth:
// playnext/PHASE_9_CONTRACT.md. Keep in sync when the backend changes.

export type Region = "US" | "UK" | "EU" | "UA" | "TR" | "AR";
export type FeedbackAction = "liked" | "disliked" | "not_interested" | "already_own" | "dismissed";
export type PlaytimeBucket = "barely_touched" | "some_hours" | "sunk_50plus";

export interface Me {
  authenticated: boolean;
  user?: { id: number; display_name: string | null };
  consent_required?: boolean;
}

export type OnboardingStep = "region" | "quiz" | "library";
export interface OnboardingStatus {
  complete: boolean;
  next_step: OnboardingStep | null;
  next_route: string | null;
  steps: Record<OnboardingStep, boolean>;
}

export interface SettingsView {
  display_name: string | null;
  email: string | null;
  steam_linked: boolean;
  region: Region | null;
  budget_ceiling_toman: number | null;
  region_options: { code: Region; label: string }[];
  /** Highest price in the catalog, in Toman: the top of the budget slider. NOT sent by the backend yet
   *  (needs adding to GET /settings); the UI falls back to DEFAULT_BUDGET_MAX_TOMAN until it is. */
  budget_max_toman?: number;
}

/** Linked PlayNext sign-in methods, read from Global Auth by the PC backend. null = Auth couldn't say. */
export interface SignInMethods { google: boolean | null; steam: boolean | null }

export interface PriceFields {
  price_native: number | null;
  price_currency: string | null;
  price_toman: number | null;
  discount_pct: number | null;
}

export interface GameCard extends PriceFields {
  game_id: number;
  title: string;
  cover_url: string | null;
  in_wishlist?: boolean;
  in_cart?: boolean;
  score?: number;
  reason?: string | null;
  playtime_hours?: number;
  review_score?: number;
  genres?: string[];
}

export interface QuizOption { game_id: number; title: string; genres: string[]; cover_url: string | null }

export interface LibraryItem {
  game_id: number;
  title: string;
  cover_url: string | null;
  source: string;
  removable: boolean;
  playtime_hours: number | null;
  playtime_bucket: PlaytimeBucket | null;
  user_rating: number | null;
}

export interface WishlistItem extends PriceFields {
  game_id: number;
  /** Primary edition, for adding straight to the cart; null when the game has no edition yet. */
  game_edition_id: number | null;
  title: string;
  cover_url: string | null;
  source: string;
  removable: boolean;
  added_at: string | null;
}

export type SyncStatus = "not_applicable" | "never" | "queued" | "running" | "done" | "failed";

export interface CartItemView {
  item_id: number;
  game_id: number;
  game_edition_id: number;
  title: string;
  edition_name: string | null;
  cover_url: string | null;
  price_toman_locked: number | null;
  source_price: number | null;
  source_currency: string | null;
  price_toman_now: number | null;
  price_changed: boolean;
  buy_url: string | null;
}
export interface CartView {
  platforms: { platform: "steam" | "gog" | "epic" | "other"; items: CartItemView[] }[];
  count: number;
  total_toman: number;
  region: Region | null;
  disclaimer: string;
}

export interface GameDetail {
  game_id: number;
  title: string;
  description: string | null;
  developer: string | null;
  publisher: string | null;
  genres: string[];
  tags: string[];
  platforms: string[];
  release_year: number | null;
  review_score: number | null;
  cover_url: string | null;
  editions: {
    game_edition_id: number;
    edition_name: string | null;
    is_primary: boolean;
    platforms: string[];
    buy_url: string | null;
    prices: (PriceFields & { region: Region; is_user_region: boolean; is_free: boolean })[];
  }[];
  user_state: { owned: boolean; wishlisted: boolean; in_cart: boolean; feedback: FeedbackAction | null };
  recommendation: { reason: string | null; score: number; kind: "new_game" | "backlog" } | null;
  similar: (PriceFields & { game_id: number; title: string; cover_url: string | null; similarity: number })[];
}

export interface GamerDna {
  has_data: boolean;
  games_count: number;
  total_hours: number;
  backlog_count: number;
  /** 0..1 fraction (0.63 = 63%). */
  avg_achievement_completion: number | null;
  most_played_studio: { name: string; hours: number } | null;
  top_genres: { genre: string; hours: number }[];
  most_played_game: { game_id: number; title: string; hours: number; cover_url: string | null } | null;
  type_label: string | null;
}

export interface SearchResult {
  game_id: number;
  title: string;
  developer: string | null;
  release_year: number | null;
  cover_url: string | null;
}
