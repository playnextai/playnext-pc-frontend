"use client";
import { useRouter } from "next/navigation";
import GameCardView from "@/components/GameCardView";
import type { FeedRowData } from "@/lib/feed";

export default function FeedRow({ row, onRemove }: { row: FeedRowData; onRemove: (gameId: number) => void }) {
  const router = useRouter();
  return (
    <section className="feed-row" aria-labelledby={`row-${row.id}`}>
      <h2 id={`row-${row.id}`}>{row.title}</h2>
      {row.subtitle && <p className="muted" style={{ margin: "0 0 12px" }}>{row.subtitle}</p>}
      <div className="grid">
        {row.cards.map((g) => <GameCardView key={g.game_id} game={g} onRemove={onRemove} onOpen={(id) => router.push(`/game/${id}`)} />)}
      </div>
    </section>
  );
}
