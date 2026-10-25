/** The backend ignores queries shorter than 2 characters (returns nothing). */
export const MIN_QUERY_LENGTH = 2;
export const normalizeQuery = (q: string) => q.trim();
export const shouldSearch = (q: string) => normalizeQuery(q).length >= MIN_QUERY_LENGTH;

/** Shown live in the dropdown when a search finds nothing (same copy as the manual-entry design). */
export const NO_RESULTS_COPY =
  "We couldn't find that one. No worries - we'll still learn from everything else you add.";
