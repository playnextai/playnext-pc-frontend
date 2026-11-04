/** Toggle a game id in a selection, returning a NEW set (React state must not be mutated). */
export function toggleSelection(selected: ReadonlySet<number>, id: number): Set<number> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** Number of different genres among the picked games (each game counts under its first genre). */
export function genreSpread(options: readonly { game_id: number; genres: string[] }[], picked: ReadonlySet<number>): number {
  const seen = new Set<string>();
  for (const o of options) if (picked.has(o.game_id) && o.genres[0]) seen.add(o.genres[0]);
  return seen.size;
}

export const SPREAD_MIN_PICKS = 3;
export const SPREAD_MIN_GENRES = 3;

/** Live counter text key. No minimum: "Let's go" is live from the first tap. The encouraging "nice spread"
 *  line only appears when it is true: at least 3 picks across at least 3 different genres. */
export function counterKey(n: number, spread = 0): "quiz.none" | "quiz.one" | "quiz.many" | "quiz.spread" {
  if (n === 0) return "quiz.none";
  if (n === 1) return "quiz.one";
  return n >= SPREAD_MIN_PICKS && spread >= SPREAD_MIN_GENRES ? "quiz.spread" : "quiz.many";
}
