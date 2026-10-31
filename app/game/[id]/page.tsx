"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import Empty from "@/components/Empty";
import Icon, { type IconName } from "@/components/Icon";
import Thumb from "@/components/Thumb";
import { useI18n } from "@/components/I18nProvider";
import { api, ApiError } from "@/lib/api";
import type { FeedbackAction, GameDetail } from "@/lib/types";

const PLATFORM_NAME: Record<string, string> = { steam: "Steam", gog: "GOG", epic: "Epic" };

// Game detail: five actions (like, dislike, not interested, already own, wishlist), Steam editions with
// the person's regional price (Toman first), tags, similar games. Descriptions stay in English by decision.
export default function GamePage() {
  const { t, toman, native, percent } = useI18n();
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const [g, setG] = useState<GameDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(id)) { setMissing(true); return; }
    api.game(id).then(setG).catch((e) => (e instanceof ApiError && e.status === 404 ? setMissing(true) : setError(t("common.refresh"))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function feedback(action: FeedbackAction) {
    if (!g || busy) return;
    setBusy(true); setError(null);
    try {
      await api.feedback(g.game_id, action);
      setG({ ...g, user_state: { ...g.user_state, feedback: action, owned: action === "already_own" ? true : g.user_state.owned } });
    } catch { setError(t("common.saveFailed")); } finally { setBusy(false); }
  }
  async function wishlist() {
    if (!g || busy || g.user_state.wishlisted) return;
    setBusy(true); setError(null);
    try { await api.addToWishlist(g.game_id); setG({ ...g, user_state: { ...g.user_state, wishlisted: true } }); }
    catch { setError(t("common.saveFailed")); } finally { setBusy(false); }
  }
  async function addToCart(editionId: number) {
    if (!g || busy) return;
    setBusy(true); setError(null);
    try { await api.addToCart(editionId); setG({ ...g, user_state: { ...g.user_state, in_cart: true } }); }
    catch { setError(t("common.saveFailed")); } finally { setBusy(false); }
  }

  const actions: { key: string; label: string; icon: IconName; on: boolean; run: () => void }[] = g ? [
    { key: "like", label: t("detail.like"), icon: "heart", on: g.user_state.feedback === "liked", run: () => feedback("liked") },
    { key: "dislike", label: t("detail.dislike"), icon: "x", on: g.user_state.feedback === "disliked", run: () => feedback("disliked") },
    { key: "ni", label: t("detail.notInterested"), icon: "x", on: g.user_state.feedback === "not_interested", run: () => feedback("not_interested") },
    { key: "own", label: t("detail.alreadyOwn"), icon: "check", on: g.user_state.owned || g.user_state.feedback === "already_own", run: () => feedback("already_own") },
    { key: "wl", label: g.user_state.wishlisted ? t("detail.inWishlist") : t("detail.wishlist"), icon: "star", on: g.user_state.wishlisted, run: wishlist },
  ] : [];

  return (
    <AppShell>
      <main className="container" style={{ paddingBottom: 64, maxWidth: 860 }}>
        {missing && <div style={{ marginTop: 32 }}><Empty icon="warn" title={t("detail.notFound")}><Link className="btn" href="/discover">{t("state.toFeed")}</Link></Empty></div>}
        {error && <p className="error" role="alert">{error}</p>}
        {!g && !missing && !error && <p className="muted">{t("common.loading")}</p>}
        {g && (
          <>
            <Link href="/discover" style={{ display: "inline-flex", gap: 6, alignItems: "center", margin: "20px 0 0", textDecoration: "none" }}>
              <Icon name="arrow" className="icon flip" /> {t("detail.back")}
            </Link>
            <div style={{ display: "flex", gap: 24, margin: "16px 0", flexWrap: "wrap" }}>
              {g.cover_url ? <img src={g.cover_url} alt="" style={{ width: 220, borderRadius: 14 }} /> : <span className="cover" style={{ width: 220 }} />}
              <div style={{ flex: 1, minWidth: 240 }}>
                <h1 style={{ margin: "0 0 6px", fontWeight: 600 }} dir="auto">{g.title}</h1>
                <div className="muted" style={{ marginBottom: 10 }} dir="auto">
                  {[g.developer ? t("detail.by", { name: g.developer }) : null, g.release_year, g.genres.slice(0, 3).join(" · ")].filter(Boolean).join(" · ")}
                  {g.review_score !== null && <> · {t("detail.reviews", { n: Math.round(g.review_score) })}</>}
                </div>
                {g.recommendation?.reason && <p style={{ margin: "0 0 10px" }}><strong>{t("detail.whyPicked")}:</strong> <span className="muted">{g.recommendation.reason}</span></p>}
                <div role="group" aria-label={t("card.actions")} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {actions.map((a) => (
                    <button key={a.key} aria-pressed={a.on} disabled={busy} onClick={a.run} className="chip"
                      style={{ minHeight: 40, cursor: "pointer", color: a.on ? "var(--mint)" : "var(--text)", borderColor: a.on ? "var(--mint)" : "#3a3a38" }}>
                      <Icon name={a.icon} /> {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {g.description && <section className="stack"><h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: "16px 0 0" }}>{t("detail.about")}</h2>
              <p className="muted" lang="en" dir="ltr" style={{ margin: 0, lineHeight: 1.7 }}>{g.description}</p></section>}

            <section className="stack" style={{ marginTop: 24 }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>{t("detail.editions")}</h2>
              {g.editions.map((ed) => {
                const p = ed.prices.find((x) => x.is_user_region) ?? ed.prices[0];
                const nat = p ? native(p.price_native, p.price_currency) : null;
                return (
                  <div key={ed.game_edition_id} className="card" style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <strong dir="auto">{ed.edition_name ?? g.title}</strong>
                      <div className="muted" style={{ fontSize: ".85rem" }}>{ed.platforms.map((x) => PLATFORM_NAME[x] ?? x).join(" · ")}</div>
                    </div>
                    <div style={{ textAlign: "end" }}>
                      <div className="price">{p?.is_free ? t("detail.free") : toman(p?.price_toman)}
                        {!!p?.discount_pct && <span style={{ color: "var(--danger)", background: "var(--danger-bg)", borderRadius: 6, padding: "1px 6px", marginInlineStart: 8, fontSize: ".8rem" }}>-{percent(p.discount_pct)}</span>}
                      </div>
                      {nat && <div className="muted" style={{ fontSize: ".85rem" }}>{nat}</div>}
                    </div>
                    <button className="btn small" disabled={busy || g.user_state.in_cart} onClick={() => addToCart(ed.game_edition_id)}>
                      {g.user_state.in_cart ? t("detail.inCart") : t("detail.addToCart")}
                    </button>
                    {ed.buy_url && <a className="btn secondary small" href={ed.buy_url} target="_blank" rel="noopener noreferrer">{t("detail.buy")}</a>}
                  </div>
                );
              })}
            </section>

            {g.tags.length > 0 && <section className="stack" style={{ marginTop: 24 }}><h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>{t("detail.tags")}</h2>
              <div className="row" lang="en" dir="ltr">{g.tags.slice(0, 14).map((x) => <span key={x} className="chip">{x}</span>)}</div></section>}

            {g.similar.length > 0 && <section className="stack" style={{ marginTop: 24 }}><h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>{t("detail.similar")}</h2>
              <div className="grid">{g.similar.slice(0, 6).map((s) => (
                <Link key={s.game_id} href={`/game/${s.game_id}`} className="card" style={{ color: "var(--text)", textDecoration: "none", display: "flex", gap: 12, alignItems: "center" }}>
                  <Thumb url={s.cover_url} /><span><strong dir="auto" style={{ display: "block" }}>{s.title}</strong><span className="price" style={{ fontSize: ".9rem" }}>{toman(s.price_toman)}</span></span>
                </Link>))}</div></section>}
          </>
        )}
      </main>
    </AppShell>
  );
}
