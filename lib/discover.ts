// Search and Discover: the filter state lives in the URL (shareable, back button works), and these
// pure helpers turn it into API params and back. Defaults are omitted from the URL.
export type LibraryMode = "not_owned" | "owned" | "all";
export type SortMode = "relevance" | "price_asc" | "price_desc" | "newest";

export interface DiscoverQuery {
  q: string;
  genres: string[];
  minPrice: number;            // Toman, 0 = no lower bound
  maxPrice: number | null;     // Toman, null = no limit
  library: LibraryMode;
  sort: SortMode;
}

export const DEFAULT_QUERY: DiscoverQuery = { q: "", genres: [], minPrice: 0, maxPrice: null, library: "not_owned", sort: "relevance" };
export const LIBRARY_MODES: LibraryMode[] = ["not_owned", "owned", "all"];
export const SORT_MODES: SortMode[] = ["relevance", "price_asc", "price_desc", "newest"];
export const PAGE_SIZE = 24;
export const DROPDOWN_SIZE = 5;

const oneOf = <T extends string>(list: readonly T[], v: string | null, fallback: T): T => (list as readonly string[]).includes(v ?? "") ? (v as T) : fallback;
const nonNegInt = (v: string | null): number | null => {
  if (v === null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
};

/** URL search params -> query (bad values fall back to defaults, never throw). */
export function parseQuery(sp: { get(name: string): string | null }): DiscoverQuery {
  const genres = (sp.get("genres") ?? "").split(",").map((g) => g.trim()).filter(Boolean);
  return {
    q: (sp.get("q") ?? "").trim(),
    genres,
    minPrice: nonNegInt(sp.get("min")) ?? 0,
    maxPrice: nonNegInt(sp.get("max")),
    library: oneOf(LIBRARY_MODES, sp.get("library"), "not_owned"),
    sort: oneOf(SORT_MODES, sp.get("sort"), "relevance"),
  };
}

/** Query -> the page's URL query string ("" when everything is default). */
export function toSearchString(q: DiscoverQuery): string {
  const p: string[] = [];
  const add = (k: string, v: string) => p.push(`${k}=${encodeURIComponent(v)}`);
  if (q.q.trim()) add("q", q.q.trim());
  if (q.genres.length) add("genres", q.genres.join(","));
  if (q.minPrice > 0) add("min", String(q.minPrice));
  if (q.maxPrice !== null) add("max", String(q.maxPrice));
  if (q.library !== "not_owned") add("library", q.library);
  if (q.sort !== "relevance") add("sort", q.sort);
  return p.join("&");
}

/** Query -> params for GET /games/discover. */
export function toApiParams(q: DiscoverQuery, limit: number, offset: number): Record<string, string | number | undefined> {
  return {
    q: q.q.trim() || undefined,
    genres: q.genres.length ? q.genres.join(",") : undefined,
    min_price: q.minPrice > 0 ? q.minPrice : undefined,
    max_price: q.maxPrice ?? undefined,
    library: q.library,
    sort: q.sort,
    limit,
    offset,
  };
}

/** How many filters differ from the defaults (the number on the phone "Filters" button). Text and sort are not filters. */
export function activeFilterCount(q: DiscoverQuery): number {
  return q.genres.length + (q.minPrice > 0 || q.maxPrice !== null ? 1 : 0) + (q.library !== "not_owned" ? 1 : 0);
}

/** Reset the filters but keep what was typed and the chosen sort. */
export const clearFilters = (q: DiscoverQuery): DiscoverQuery => ({ ...DEFAULT_QUERY, q: q.q, sort: q.sort });

export const toggleGenre = (q: DiscoverQuery, genre: string): DiscoverQuery => ({
  ...q,
  genres: q.genres.some((g) => g.toLowerCase() === genre.toLowerCase())
    ? q.genres.filter((g) => g.toLowerCase() !== genre.toLowerCase())
    : [...q.genres, genre],
});

/** The price slider has steps from 0 to `max`; the top step means "no limit". */
export const SLIDER_STEPS = 50;
export const stepToToman = (step: number, max: number) => Math.round((step / SLIDER_STEPS) * max);
export const tomanToStep = (toman: number, max: number) => (max > 0 ? Math.max(0, Math.min(SLIDER_STEPS, Math.round((toman / max) * SLIDER_STEPS))) : 0);
