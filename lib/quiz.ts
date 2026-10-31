/** Toggle a game id in a selection, returning a NEW set (React state must not be mutated). */
export function toggleSelection(selected: ReadonlySet<number>, id: number): Set<number> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** Live counter under the quiz grid (text key + count). No minimum: "Let's go" is live from the first tap. */
export function counterKey(n: number): "quiz.none" | "quiz.one" | "quiz.many" {
  return n === 0 ? "quiz.none" : n === 1 ? "quiz.one" : "quiz.many";
}
