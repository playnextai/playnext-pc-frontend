"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import LangToggle from "@/components/LangToggle";
import { signInUrl } from "@/lib/auth";
import Empty from "@/components/Empty";
import Icon, { type IconName } from "@/components/Icon";
import Thumb from "@/components/Thumb";
import { useI18n } from "@/components/I18nProvider";
import { api, ApiError } from "@/lib/api";
import { toPersianNumerals } from "@/lib/i18n";
import type { FeedbackAction, GameDetail, Region } from "@/lib/types";

const PLATFORM_NAME: Record<string, string> = { steam: "Steam", gog: "GOG", epic: "Epic" };

// Game detail: five actions (like, dislike, not interested, already own, wishlist), Steam editions with
// the person's regional price (Toman first), tags, similar games. Descriptions stay in English by decision.
export default function GamePage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => { api.me().then((m) => setAuthed(m.authenticated)).catch(() => setAuthed(false)); }, []);
  if (authed === null) return <main className="container"><p className="muted">{t("common.loading")}</p></main>;
  // Signed in: the full page inside the app shell. Signed out: the same page, public (no actions, every region's price).
  return authed
    ? <AppShell><GameBody authed /></AppShell>
    : (
      <>
        <header className="nav"><nav className="nav-inner">
          <a className="wordmark" href="/">PlayNext</a><span className="spacer" /><LangToggle />
          <a className="btn small" href={signInUrl(`/game/${params?.id ?? ""}`)}>{t("detail.signIn")}</a>
        </nav></header>
        <GameBody authed={false} />
      </>
    );
}

function GameBody({ authed }: { authed: boolean }) {
  const { t, toman, native, percent, reason, genre, region, lang } = useI18n();
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
    { key: "dislike", label: t("detail.dislike"), icon: "thumbsDown", on: g.user_state.feedback === "disliked", run: () => feedback("disliked") },
    { key: "ni", label: t("detail.notInterested"), icon: "x", on: g.user_state.feedback === "not_interested", run: () => feedback("not_interested") },
    { key: "own", label: t("detail.alreadyOwn"), icon: "check", on: g.user_state.owned || g.user_state.feedback === "already_own", run: () => feedback("already_own") },
    { key: "wl", label: g.user_state.wishlisted ? t("detail.inWishlist") : t("detail.wishlist"), icon: "bookmark", on: g.user_state.wishlisted, run: wishlist },
  ] : [];

  const userRegion = g?.editions.flatMap((e) => e.prices).find((p) => p.is_user_region)?.region;
  const chipBtn = (a: (typeof actions)[number]) => (
    <button key={a.key} aria-pressed={a.on} disabled={busy} onClick={a.run} className="act-btn" data-on={a.on}>
      <Icon name={a.icon} /> {a.label}
    </button>
  );
  return (
    <>
      <main className="container" style={{ paddingBottom: 64, maxWidth: 860 }}>
        {missing && <div style={{ marginTop: 32 }}><Empty icon="warn" asPage title={t("detail.notFound")}><Link className="btn" href="/discover">{t("state.toFeed")}</Link></Empty></div>}
        {error && <p className="error" role="alert">{error}</p>}
        {!g && !missing && !error && <p className="muted">{t("common.loading")}</p>}
        {g && (
          <>
            <div className="hero">
              {g.cover_url && <span className="hero-bg" aria-hidden="true" style={{ backgroundImage: `url("${g.cover_url.replace(/"/g, "%22")}")` }} />}
              <Link href={authed ? "/discover" : "/"} className="hero-x" aria-label={t("detail.back")}><Icon name="x" /></Link>
              <div className="hero-text">
                <h1 dir="auto">{g.title}</h1>
                <div className="muted" dir="auto">
                  {[g.developer, g.release_year ? (lang === "fa" ? toPersianNumerals(String(g.release_year)) : String(g.release_year)) : null, g.genres.slice(0, 3).map(genre).join(", ")].filter(Boolean).join(" · ")}
                  {g.review_score !== null && <> · {t("detail.reviews", { n: Math.round(g.review_score) })}</>}
                </div>
              </div>
              {g.cover_url && <img className="hero-cover" src={g.cover_url} alt="" />}
            </div>

            {g.recommendation?.reason && <p className="reco"><span style={{ color: "var(--mint)", display: "inline-flex" }}><Icon name="heart" /></span>{reason(g.recommendation.reason)}</p>}
            {!authed && <p className="muted" style={{ margin: "16px 0 0" }}>{t("detail.signInPrompt")}</p>}
            {authed && <div role="group" aria-label={t("card.actions")} className="act-row">
              <div className="act-main">{actions.filter((a) => a.key !== "wl").map(chipBtn)}</div>
              {actions.filter((a) => a.key === "wl").map(chipBtn)}
            </div>}

            {g.description && <p className="muted" lang="en" dir="ltr" style={{ margin: "20px 0 0", lineHeight: 1.7 }}>{g.description}</p>}

            <h2 className="sec-h">{t("detail.editions")}{authed && userRegion && <span className="muted sec-note"> · {t("detail.regionNote", { region: region(userRegion) })}</span>}</h2>
            <div className="ed-card">
              {g.editions.map((ed) => {
                const shown = authed ? [ed.prices.find((x) => x.is_user_region) ?? ed.prices[0]].filter(Boolean) : ed.prices;
                return (
                  <div key={ed.game_edition_id} className="ed-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong dir="auto">{ed.edition_name ?? g.title}</strong>{" "}
                      {ed.platforms.map((x) => <span key={x} className="chip plat-chip">{PLATFORM_NAME[x] ?? x}</span>)}
                    </div>
                    <div style={{ textAlign: "end", display: "grid", gap: 6 }}>
                      {shown.map((p) => {
                        if (!p) return null;
                        const nat = native(p.price_native, p.price_currency);
                        return (
                          <div key={p.region}>
                            {!authed && <span className="muted" style={{ fontSize: ".85rem", marginInlineEnd: 8 }}>{t(`detail.region.${p.region as Region}`)}</span>}
                            <span className="price" style={{ fontWeight: 700, fontSize: "1.05rem" }}>{p.is_free ? t("detail.free") : toman(p.price_toman)}</span>
                            {!!p.discount_pct && p.price_toman !== null && <span className="gc-badge" style={{ position: "static", marginInlineStart: 8, padding: "1px 6px" }}>-{percent(p.discount_pct)}</span>}
                            {nat && <div className="muted" style={{ fontSize: ".82rem" }}>{nat} {authed ? t("card.yourRegion") : t("detail.estimate")}</div>}
                          </div>
                        );
                      })}
                    </div>
                    {authed && (
                      <button className="btn secondary small" disabled={busy || g.user_state.in_cart} onClick={() => addToCart(ed.game_edition_id)}>
                        <Icon name="cart" className="icon-sm" /> {g.user_state.in_cart ? t("detail.inCart") : t("detail.addToCart")}
                      </button>
                    )}
                    {ed.buy_url && <a className="btn secondary small" href={ed.buy_url} target="_blank" rel="noopener noreferrer">{t("detail.buy")}</a>}
                  </div>
                );
              })}
            </div>
            <p className="muted" style={{ fontSize: ".85rem", lineHeight: 1.7, margin: "12px 0 0" }}>{t("detail.disclaimer")}</p>

            {g.tags.length > 0 && <><h2 className="sec-h">{t("detail.tags")}</h2>
              <div className="row" lang="en" dir="ltr">{g.tags.slice(0, 14).map((x) => <span key={x} className="chip" style={{ minHeight: 34 }}>{x}</span>)}</div></>}

            {g.similar.length > 0 && <><h2 className="sec-h">{t("detail.similar")}</h2>
              <div className="sim-grid">{g.similar.slice(0, 4).map((s) => (
                <Link key={s.game_id} href={`/game/${s.game_id}`} className="sim-tile">
                  <span className="sim-name" dir="auto">{s.title}</span>
                  <span className="price" style={{ fontSize: ".85rem" }}>{toman(s.price_toman)}</span>
                </Link>))}</div></>}
          </>
        )}
      </main>
    </>
  );
}
