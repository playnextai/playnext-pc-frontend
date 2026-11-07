"use client";
import { useRouter } from "next/navigation";
import GameCardView from "@/components/GameCardView";
import Icon, { type IconName } from "@/components/Icon";
import type { FeedRowData } from "@/lib/feed";

const ROW_ICON: Record<string, IconName> = { picked: "heart", next: "heart", unplayed: "library", deals: "tag", unusual: "compass", popular: "star" };

export default function FeedRow({ row, onRemove }: { row: FeedRowData; onRemove: (gameId: number) => void }) {
  const router = useRouter();
  return (
    <section className="feed-row" aria-labelledby={`row-${row.id}`}>
      <h2 id={`row-${row.id}`}><span className="row-ic"><Icon name={ROW_ICON[row.id] ?? "heart"} /></span>{row.title}</h2>
      {row.subtitle && <p className="muted" style={{ margin: "0 0 12px" }}>{row.subtitle}</p>}
      <div className="feed-grid" style={{ "--cols": Math.min(row.cards.length, 4) } as React.CSSProperties}>
        {row.cards.map((g) => <GameCardView key={g.game_id} game={g} onRemove={onRemove} onOpen={(id) => router.push(`/game/${id}`)} />)}
      </div>
    </section>
  );
}
