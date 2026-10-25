"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Gate from "@/components/Gate";
import { api } from "@/lib/api";
import { formatToman } from "@/lib/format";
import { BUDGET_PRESETS_TOMAN } from "@/lib/feed";
import type { SettingsView } from "@/lib/types";

/** Gate + the signed-in navigation: Library, Wishlist, Cart (with count badge), the budget chip,
 *  the region chip (links to Settings) and the profile avatar. The budget chip edits the SAME
 *  value as the Settings page (users.budget_ceiling_toman) - there is one setting, two editors.
 *  `onBudgetChange` lets a page refetch price-filtered rows after the budget moves. */
export default function AppShell({ children, onBudgetChange }: { children: React.ReactNode; onBudgetChange?: () => void }) {
  return (
    <Gate>
      <Nav onBudgetChange={onBudgetChange} />
      {children}
    </Gate>
  );
}

function Nav({ onBudgetChange }: { onBudgetChange?: () => void }) {
  const [settings, setSettings] = useState<SettingsView | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    api.settings().then(setSettings).catch(() => {});
    api.cart().then((c) => setCartCount(c.count)).catch(() => {});
  }, []);

  const changeBudget = useCallback(async (value: string) => {
    const budget = value === "" ? null : Number(value);
    try {
      setSettings(await api.updateSettings({ budget_ceiling_toman: budget }));
      onBudgetChange?.();
    } catch { /* leave the chip as it was */ }
  }, [onBudgetChange]);

  const regionLabel = settings?.region_options.find((o) => o.code === settings.region)?.label;
  const initial = (settings?.display_name ?? settings?.email ?? "?").trim().charAt(0).toUpperCase();
  const budget = settings?.budget_ceiling_toman ?? null;
  const presets = budget !== null && !BUDGET_PRESETS_TOMAN.includes(budget) ? [...BUDGET_PRESETS_TOMAN, budget].sort((a, b) => a - b) : BUDGET_PRESETS_TOMAN;

  return (
    <header className="nav">
      <nav className="nav-inner" aria-label="Main">
        <Link className="item" href="/discover" aria-label="Home"><strong>PlayNext</strong></Link>
        <span className="spacer" />
        <Link className="item" href="/library" aria-label="Library">▤<span className="label">Library</span></Link>
        <Link className="item" href="/wishlist" aria-label="Wishlist">★<span className="label">Wishlist</span></Link>
        <Link className="item" href="/cart" aria-label="Cart">🛒<span className="label">Cart</span>{cartCount > 0 && <span className="badge">{cartCount}</span>}</Link>
        <select className="chip-box" aria-label="Budget" value={budget === null ? "" : String(budget)} onChange={(e) => changeBudget(e.target.value)}>
          <option value="">No budget limit</option>
          {presets.map((p) => <option key={p} value={p}>Up to {formatToman(p, "en-US")}</option>)}
        </select>
        <Link className="item" href="/settings" aria-label="Pricing region">🌍<span className="label">{regionLabel ?? "Region"}</span></Link>
        <Link className="item" href="/settings" aria-label="Profile"><span className="avatar">{initial}</span></Link>
      </nav>
    </header>
  );
}
