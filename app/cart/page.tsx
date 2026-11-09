"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Empty from "@/components/Empty";
import Thumb from "@/components/Thumb";
import Icon from "@/components/Icon";
import SkeletonRows from "@/components/Skeleton";
import { useI18n } from "@/components/I18nProvider";
import { api } from "@/lib/api";
import type { CartView } from "@/lib/types";

const PLATFORM_NAME: Record<string, string> = { steam: "Steam", gog: "GOG", epic: "Epic", other: "Other" };

// Cart: grouped by store. The price locked when the item was added is compared with today's price;
// a changed price is flagged. We never take payment: "Buy" opens the store's own page.
export default function CartPage() {
  const { t, toman, native } = useI18n();
  const games = (n: number) => (n === 1 ? t("cart.gamesOne") : t("cart.gamesMany", { n }));
  const [cart, setCart] = useState<CartView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setCart(await api.cart()); } catch { setError(t("common.refresh")); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { load(); }, [load]);

  async function remove(itemId: number) {
    try { await api.removeFromCart(itemId); await load(); } catch { setError(t("cart.removeFailed")); }
  }

  return (
    <AppShell>
      <main className="container" style={{ paddingBottom: 64, maxWidth: 860 }}>
        <h1 className="page-title" style={{ fontSize: "2rem", margin: "28px 0 4px" }}>{t("cart.title")}</h1>
        <p className="muted" style={{ margin: 0 }}>{cart && cart.count > 0 ? t("cart.sub", { games: games(cart.count) }) : "\u00a0"}</p>
        {error && <p className="error" role="alert">{error}</p>}
        {cart === null && !error && <SkeletonRows />}
        {cart && cart.count === 0 && (
          <div style={{ marginTop: 24 }}>
            <Empty icon="cart" title={t("cart.empty")} text={t("cart.emptySub")}>
              <Link className="btn" href="/discover">{t("cart.browse")}</Link>
            </Empty>
          </div>
        )}
        {cart && cart.count > 0 && (
          <>
            {cart.platforms.filter((p) => p.items.length).map((p) => {
              const name = PLATFORM_NAME[p.platform] ?? p.platform;
              return (
                <section key={p.platform} style={{ margin: "24px 0" }} aria-label={name}>
                  <h2 className="cart-h"><Icon name="gamepad" /><span>{name}</span><span className="muted"> · {games(p.items.length)}</span></h2>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                    {p.items.map((it) => {
                      const nat = native(it.source_price, it.source_currency);
                      return (
                        <li key={it.item_id} className="card wl-row" style={{ alignItems: "center" }}>
                          <Thumb url={it.cover_url} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                              <Link href={`/game/${it.game_id}`} className="link-title" dir="auto">{it.title}</Link>
                              {it.edition_name && <span className="muted" style={{ fontSize: ".85rem" }}>{it.edition_name}</span>}
                              {it.price_changed && <span className="warn-chip">{t("cart.priceChanged")}</span>}
                            </div>
                            <div className="price" style={{ fontSize: "1.05rem" }}>{toman(it.price_toman_locked)}</div>
                            <div className="muted" style={{ fontSize: ".82rem" }} role={it.price_changed ? "status" : undefined}>
                              {it.price_changed ? t("cart.changedNote", { platform: name, price: toman(it.price_toman_now) }) : nat ? t("cart.lockedNative", { price: nat }) : t("cart.lockedOnly")}
                            </div>
                          </div>
                          {it.buy_url
                            ? <a className="btn secondary small" href={it.buy_url} target="_blank" rel="noopener noreferrer">{t("cart.buy", { platform: name })}</a>
                            : <button className="btn secondary small" disabled>{t("cart.buy", { platform: name })}</button>}
                          <button className="icon-btn" aria-label={`${t("common.remove")}: ${it.title}`} onClick={() => remove(it.item_id)}><Icon name="trash" /></button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
            <div className="cart-total">
              <span style={{ fontSize: "1.1rem" }}>{t("cart.total")}</span>
              <span className="price" style={{ fontSize: "1.6rem" }}>{toman(cart.total_toman)}</span>
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}
