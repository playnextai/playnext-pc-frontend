"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import ConnectSteam from "@/components/ConnectSteam";
import Empty from "@/components/Empty";
import SearchAndAdd from "@/components/SearchAndAdd";
import Thumb from "@/components/Thumb";
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

  return (
    <AppShell>
      <main className="container" style={{ paddingBottom: 64, maxWidth: 820 }}>
        <h1 className="page-title">{t("wishlist.title")}</h1>
        {steamLinked === false && <div style={{ margin: "12px 0" }}><ConnectSteam variant="banner" returnPath="/wishlist" /></div>}
        <SearchAndAdd target="wishlist" alreadyAddedIds={ids} onAdded={() => { load(); }} />
        {error && <p className="error" role="alert">{error}</p>}
        {items === null && !error && <SkeletonRows />}
        {items && items.length === 0 && (
          <div style={{ marginTop: 24 }}><Empty icon="star" title={t("wishlist.empty")} text={t("wishlist.emptySub")} /></div>
        )}
        <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0", display: "grid", gap: 10 }}>
          {items?.map((g) => {
            const nat = native(g.price_native, g.price_currency);
            return (
              <li key={g.game_id} className="card" style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                <Thumb url={g.cover_url} />
                <div style={{ flex: 1, minWidth: 160 }}>
                  <Link href={`/game/${g.game_id}`} className="link-title">{g.title}</Link>
                  <div className="muted" style={{ fontSize: ".85rem" }}>{g.source !== "manual" ? t("wishlist.fromSteam") : t("wishlist.addedByYou")}</div>
                </div>
                <div style={{ textAlign: "end" }}>
                  <div className="price">
                    {toman(g.price_toman)}
                    {!!g.discount_pct && g.price_toman !== null && <span style={{ color: "var(--danger)", background: "var(--danger-bg)", borderRadius: 6, padding: "1px 6px", marginInlineStart: 8, fontSize: ".8rem" }}>-{percent(g.discount_pct)}</span>}
                  </div>
                  {nat && <div className="muted" style={{ fontSize: ".85rem" }}>{nat}</div>}
                </div>
                {g.game_edition_id !== null && (
                  <button className="btn small" disabled={inCart.has(g.game_id)} onClick={() => toCart(g)}>
                    {inCart.has(g.game_id) ? t("wishlist.inCart") : t("wishlist.toCart")}
                  </button>
                )}
                {g.removable && <button className="btn secondary small" onClick={() => remove(g.game_id)}>{t("common.remove")}</button>}
              </li>
            );
          })}
        </ul>
      </main>
    </AppShell>
  );
}
