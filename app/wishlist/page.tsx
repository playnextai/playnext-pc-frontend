"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import ConnectSteam from "@/components/ConnectSteam";
import Empty from "@/components/Empty";
import SearchAndAdd from "@/components/SearchAndAdd";
import Thumb from "@/components/Thumb";
import Icon from "@/components/Icon";
import SkeletonRows from "@/components/Skeleton";
import { useI18n } from "@/components/I18nProvider";
import { api } from "@/lib/api";
import type { WishlistItem } from "@/lib/types";

// Wishlist: synced from Steam plus games added by hand. Email-only people see a dismissible
// "Connect Steam" banner (a nudge, never a block). Prices are Toman first, regional price beneath.
export default function WishlistPage() {
  const { t, toman, native, percent } = useI18n();
  const [items, setItems] = useState<WishlistItem[] | null>(null);
  const [steamLinked, setSteamLinked] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inCart, setInCart] = useState<Set<number>>(new Set());
  const synced = (items ?? []).filter((i) => i.removable === false).length;

  const load = useCallback(async () => {
    try { setItems((await api.wishlist()).items); } catch { setError(t("common.refresh")); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    load();
    api.settings().then((s) => setSteamLinked(s.steam_linked)).catch(() => setSteamLinked(null));
  }, [load]);

  const ids = useMemo(() => new Set((items ?? []).map((i) => i.game_id)), [items]);

  async function toCart(g: WishlistItem) {
    if (g.game_edition_id === null) return;
    try { await api.addToCart(g.game_edition_id); setInCart((s) => new Set(s).add(g.game_id)); }
    catch { setError(t("wishlist.cartFailed")); }
  }

  async function remove(id: number) {
    try { await api.removeFromWishlist(id); setItems((l) => l && l.filter((i) => i.game_id !== id)); }
    catch { setError(t("wishlist.removeFailed")); }
  }

  const n = items?.length ?? 0;
  const manual = n - synced;
  return (
    <AppShell>
      <main className="container" style={{ paddingBottom: 64, maxWidth: 860 }}>
        <h1 className="page-title" style={{ fontSize: "2rem", margin: "28px 0 4px" }}>{t("wishlist.title")}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {items === null ? "\u00a0" : n === 0 ? t("wishlist.emptyTitle") : synced > 0 ? t("wishlist.summary", { n, s: synced, m: manual }) : t("wishlist.summaryManual", { n })}
        </p>
        {steamLinked === false && <div style={{ margin: "20px 0 0" }}><ConnectSteam variant="banner" returnPath="/wishlist" /></div>}
        <div style={{ marginTop: 20 }}><SearchAndAdd target="wishlist" alreadyAddedIds={ids} onAdded={() => { load(); }} /></div>
        {error && <p className="error" role="alert">{error}</p>}
        {items === null && !error && <SkeletonRows />}
        {items && items.length === 0 && (
          <div style={{ marginTop: 20 }}><Empty icon="bookmark" title={t("wishlist.emptyTitle")} text={t("wishlist.emptySub")} /></div>
        )}
        <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0", display: "grid", gap: 10 }}>
          {items?.map((g) => {
            const nat = native(g.price_native, g.price_currency);
            return (
              <li key={g.game_id} className="card wl-row">
                <Thumb url={g.cover_url} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/game/${g.game_id}`} className="link-title" dir="auto" style={{ minHeight: 28 }}>{g.title}</Link>
                  <div className="price" style={{ fontSize: "1rem" }}>
                    {toman(g.price_toman)}
                    {!!g.discount_pct && g.price_toman !== null && <span className="gc-badge" style={{ position: "static", marginInlineStart: 8, padding: "1px 6px" }}>-{percent(g.discount_pct)}</span>}
                  </div>
                  {nat && <div className="muted" style={{ fontSize: ".82rem" }}>{nat}</div>}
                </div>
                <span className={g.removable ? "muted lib-tag" : "chip lib-chip"}>{g.removable ? t("wishlist.addedByYou") : t("wishlist.fromSteam")}</span>
                {g.game_edition_id !== null && (
                  <button className="btn secondary small" disabled={inCart.has(g.game_id)} onClick={() => toCart(g)}>
                    {inCart.has(g.game_id) ? t("wishlist.inCart") : t("wishlist.toCart")}
                  </button>
                )}
                {g.removable && <button className="icon-btn" aria-label={`${t("common.remove")}: ${g.title}`} onClick={() => remove(g.game_id)}><Icon name="trash" /></button>}
              </li>
            );
          })}
        </ul>
        {items && items.length > 0 && <p className="muted" style={{ fontSize: ".9rem", lineHeight: 1.7, margin: "20px 0 0" }}>{synced > 0 ? t("wishlist.note") : t("wishlist.notePrices")}</p>}
      </main>
    </AppShell>
  );
}
