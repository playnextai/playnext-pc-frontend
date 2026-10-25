"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import FeedRow from "@/components/FeedRow";
import SyncBanner from "@/components/SyncBanner";
import { api } from "@/lib/api";
import { dedupeRows, isColdStart, type FeedRowData } from "@/lib/feed";

const LIMIT = 12;

// Rows, in display order (a game appears once, in the first row that has it):
//   Picked for you -> What to play next (engine backlog) -> Still in your library (owned, barely played)
//   -> Good deals for you -> Out of the usual
// Cold start (no personal rows): "Popular right now" + buttons back to the quiz / manual add.
export default function Discover() {
  const [rows, setRows] = useState<FeedRowData[] | null>(null);
  const [popular, setPopular] = useState<FeedRowData | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    // A single failing row must not take the whole feed down.
    const safe = async <T,>(p: Promise<T>, fallback: T) => { try { return await p; } catch { return fallback; } };
    const [picked, next, unplayed, deals, unusual] = await Promise.all([
      safe(api.recommendations("new_game", LIMIT).then((r) => r.recommendations), []),
      safe(api.recommendations("backlog", LIMIT).then((r) => r.recommendations), []),
      safe(api.unplayed(LIMIT).then((r) => r.items), []),
      safe(api.deals(LIMIT).then((r) => r.items), []),
      safe(api.outOfUsual(LIMIT).then((r) => r.items), []),
    ]);
    const personal = dedupeRows([
      { id: "picked", title: "Picked for you", cards: picked },
      { id: "next", title: "What to play next", subtitle: "From games you already own", cards: next },
      { id: "unplayed", title: "Still in your library", subtitle: "Owned, barely played", cards: unplayed },
      { id: "deals", title: "Good deals for you", cards: deals },
      { id: "unusual", title: "Out of the usual", subtitle: "Strong matches outside your usual genres", cards: unusual },
    ]);
    setRows(personal);
    if (isColdStart(personal)) {
      const items = await safe(api.popular(LIMIT).then((r) => r.items), []);
      setPopular({ id: "popular", title: "Popular right now", cards: items });
    } else {
      setPopular(null);
    }
    setFailed(false);
  }, []);

  useEffect(() => { load().catch(() => setFailed(true)); }, [load]);

  const drop = (id: number) => {
    setRows((r) => r && dedupeRows(r.map((x) => ({ ...x, cards: x.cards.filter((c) => c.game_id !== id) }))));
    setPopular((p) => p && { ...p, cards: p.cards.filter((c) => c.game_id !== id) });
  };

  return (
    <AppShell onBudgetChange={() => { load().catch(() => setFailed(true)); }}>
      <main className="container" style={{ paddingBottom: 64 }}>
        <SyncBanner onFinished={() => { load().catch(() => setFailed(true)); }} />
        {failed && <p className="error">Something went wrong loading your feed. Refresh to try again.</p>}
        {rows === null && !failed && <p className="muted">Loading…</p>}
        {rows?.map((row) => <FeedRow key={row.id} row={row} onRemove={drop} />)}
        {rows && popular && (
          <>
            {popular.cards.length > 0 && <FeedRow row={popular} onRemove={drop} />}
            <div className="card" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <span>Tell us what you like and your picks will show up here.</span>
              <span style={{ display: "flex", gap: 8 }}>
                <Link className="btn" href="/onboarding/quiz">Take the taste quiz</Link>
                <Link className="btn secondary" href="/onboarding/library">Add games you've played</Link>
              </span>
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}
