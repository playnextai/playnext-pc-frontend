/** Toggle a game id in a selection, returning a NEW set (React state must not be mutated). */
export function toggleSelection(selected: ReadonlySet<number>, id: number): Set<number> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** Live counter under the quiz grid. There is no minimum: "Let's go" is live from the first tap. */
export function counterLabel(n: number): string {
  if (n === 0) return "Tap the games you like";
  return n === 1 ? "1 game picked" : `${n} games picked`;
}
