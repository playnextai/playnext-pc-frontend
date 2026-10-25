"use client";
import GameCardView from "@/components/GameCardView";
import type { FeedRowData } from "@/lib/feed";

export default function FeedRow({ row, onRemove }: { row: FeedRowData; onRemove: (gameId: number) => void }) {
  return (
    <section className="feed-row" aria-labelledby={`row-${row.id}`}>
      <h2 id={`row-${row.id}`}>{row.title}</h2>
      {row.subtitle && <p className="muted" style={{ margin: "0 0 12px" }}>{row.subtitle}</p>}
      <div className="grid">
        {row.cards.map((g) => <GameCardView key={g.game_id} game={g} onRemove={onRemove} />)}
      </div>
    </section>
  );
}
