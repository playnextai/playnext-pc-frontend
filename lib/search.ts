/** The backend ignores queries shorter than 2 characters (returns nothing). */
export const MIN_QUERY_LENGTH = 2;
export const normalizeQuery = (q: string) => q.trim();
export const shouldSearch = (q: string) => normalizeQuery(q).length >= MIN_QUERY_LENGTH;
