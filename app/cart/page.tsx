"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Empty from "@/components/Empty";
import Thumb from "@/components/Thumb";
import SkeletonRows from "@/components/Skeleton";
import { useI18n } from "@/components/I18nProvider";
import { api } from "@/lib/api";
import type { CartView } from "@/lib/types";

const PLATFORM_NAME: Record<string, string> = { steam: "Steam", gog: "GOG", epic: "Epic", other: "Other" };

// Cart: grouped by store. The price locked when the item was added is compared with today's price;
// a changed price is flagged. We never take payment: "Buy" opens the store's own page.
export default function CartPage() {
  const { t, toman, native } = useI18n();
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
      <main className="container" style={{ paddingBottom: 64, maxWidth: 820 }}>
        <h1 className="page-title">{t("cart.title")}</h1>
        {error && <p className="error" role="alert">{error}</p>}
        {cart === null && !error && <SkeletonRows />}
        {cart && cart.count === 0 && (
          <Empty icon="cart" title={t("cart.empty")} text={t("cart.emptySub")}>
            <Link className="btn" href="/discover">{t("cart.browse")}</Link>
          </Empty>
        )}
        {cart && cart.count > 0 && (
          <>
            {cart.platforms.filter((p) => p.items.length).map((p) => (
              <section key={p.platform} style={{ margin: "20px 0" }} aria-label={PLATFORM_NAME[p.platform] ?? p.platform}>
                <h2 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 8px" }}>{PLATFORM_NAME[p.platform] ?? p.platform}</h2>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                  {p.items.map((it) => {
                    const was = it.price_changed ? toman(it.price_toman_locked) : null;
                    const nat = native(it.source_price, it.source_currency);
                    return (
                      <li key={it.item_id} className="card" style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                        <Thumb url={it.cover_url} />
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <Link href={`/game/${it.game_id}`} className="link-title">{it.title}</Link>
                          {it.edition_name && <div className="muted" style={{ fontSize: ".85rem" }}>{it.edition_name}</div>}
                          {it.price_changed && <div style={{ color: "var(--danger)", fontSize: ".85rem" }} role="status">{t("cart.priceChanged")} · {t("cart.locked", { price: was ?? "—" })}</div>}
                        </div>
                        <div style={{ textAlign: "end" }}>
                          <div className="price">{toman(it.price_toman_now)}</div>
                          {nat && <div className="muted" style={{ fontSize: ".85rem" }}>{nat}</div>}
                        </div>
                        {it.buy_url
                          ? <a className="btn small" href={it.buy_url} target="_blank" rel="noopener noreferrer">{t("cart.buy", { platform: PLATFORM_NAME[p.platform] ?? p.platform })}</a>
                          : <span className="muted" style={{ fontSize: ".85rem" }}>{t("cart.noLink")}</span>}
                        <button className="btn secondary small" onClick={() => remove(it.item_id)}>{t("common.remove")}</button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
            <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "1.1rem" }}>
              <span>{t("cart.total")}</span><span className="price">{toman(cart.total_toman)}</span>
            </div>
            <p className="muted" style={{ fontSize: ".85rem" }}>{t("cart.disclaimer")}</p>
          </>
        )}
      </main>
    </AppShell>
  );
}
