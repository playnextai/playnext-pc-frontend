"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import FeedRow from "@/components/FeedRow";
import SyncBanner from "@/components/SyncBanner";
import { api } from "@/lib/api";
import SkeletonRows from "@/components/Skeleton";
import { useI18n } from "@/components/I18nProvider";
import Icon from "@/components/Icon";
import { dedupeRows, isColdStart, type FeedRowData } from "@/lib/feed";

const LIMIT = 12;

// Rows, in display order (a game appears once, in the first row that has it):
//   Picked for you -> What to play next (engine backlog) -> Still in your library (owned, barely played)
//   -> Good deals for you -> Out of the usual
// Cold start (no personal rows): "Popular right now" + buttons back to the quiz / manual add.
export default function Discover() {
  const { t, lang } = useI18n();
  const [rows, setRows] = useState<FeedRowData[] | null>(null);
  const [popular, setPopular] = useState<FeedRowData | null>(null);
  const [failed, setFailed] = useState(false);
  // "Undo" bar: the last removed card (feedback is only undoable for that one), with the feed as it was.
  const [undo, setUndo] = useState<{ gameId: number; rows: FeedRowData[] | null; popular: FeedRowData | null; failed?: boolean } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
      { id: "picked", title: t("feed.picked"), cards: picked },
      { id: "next", title: t("feed.next"), subtitle: t("feed.nextSub"), cards: next },
      { id: "unplayed", title: t("feed.unplayed"), subtitle: t("feed.unplayedSub"), cards: unplayed },
      { id: "deals", title: t("feed.deals"), cards: deals },
      { id: "unusual", title: t("feed.unusual"), subtitle: t("feed.unusualSub"), cards: unusual },
    ]);
    setRows(personal);
    if (isColdStart(personal)) {
      const items = await safe(api.popular(LIMIT).then((r) => r.items), []);
      setPopular({ id: "popular", title: t("feed.popular"), cards: items });
    } else {
      setPopular(null);
    }
    setFailed(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => { load().catch(() => setFailed(true)); }, [load]);

  const drop = (id: number) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo({ gameId: id, rows, popular });
    undoTimer.current = setTimeout(() => setUndo(null), 8000);
    setRows((r) => r && dedupeRows(r.map((x) => ({ ...x, cards: x.cards.filter((c) => c.game_id !== id) }))));
    setPopular((p) => p && { ...p, cards: p.cards.filter((c) => c.game_id !== id) });
  };

  async function undoRemove() {
    if (!undo) return;
    try {
      await api.undoFeedback(undo.gameId);
      setRows(undo.rows);
      setPopular(undo.popular);
      setUndo(null);
    } catch {
      setUndo({ ...undo, failed: true });
    }
  }

  return (
    <AppShell onBudgetChange={() => { load().catch(() => setFailed(true)); }}>
      <main className="container" style={{ paddingBottom: 64 }}>
        <h1 className="sr-only">{t("feed.title")}</h1>
        <SyncBanner onFinished={() => { load().catch(() => setFailed(true)); }} />
        {failed && <p className="error">{t("feed.loadFailed")}</p>}
        {rows === null && !failed && <SkeletonRows n={6} grid />}
        {rows?.map((row) => <FeedRow key={row.id} row={row} onRemove={drop} />)}
        {rows && popular && (
          <>
            {popular.cards.length > 0 && <FeedRow row={popular} onRemove={drop} />}
            <div className="card dashed" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <span><Icon name="gamepad" className="icon" /> {t("feed.coldSub")}</span>
              <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link className="btn" href="/onboarding/quiz">{t("feed.takeQuiz")}</Link>
                <Link className="btn secondary" href="/onboarding/library">{t("feed.addPlayed")}</Link>
              </span>
            </div>
          </>
        )}
      </main>
      {undo && (
        <div role="status" className="card" style={{ position: "fixed", insetInline: 16, bottom: 16, maxWidth: 480, marginInline: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, zIndex: 30 }}>
          <span className={undo.failed ? "error" : undefined}>{undo.failed ? t("undo.failed") : t("undo.bar")}</span>
          <button className="btn small" onClick={undoRemove}>{undo.failed ? t("common.tryAgain") : t("card.undo")}</button>
        </div>
      )}
    </AppShell>
  );
}
