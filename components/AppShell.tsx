"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Gate from "@/components/Gate";
import BudgetControl from "@/components/BudgetControl";
import Icon from "@/components/Icon";
import LangToggle from "@/components/LangToggle";
import { useI18n } from "@/components/I18nProvider";
import { api } from "@/lib/api";
import { budgetFromSlider } from "@/lib/feed";
import { DEFAULT_BUDGET_MAX_TOMAN } from "@/lib/feed";
import type { SettingsView } from "@/lib/types";

/** Gate + the signed-in navigation: Library, Wishlist, Cart (with count badge), the budget chip
 *  (on phones: a filters button, same menu), the region chip (links to Settings), language toggle and
 *  the profile avatar. The budget chip edits the SAME value as the Settings page
 *  (users.budget_ceiling_toman) - there is one setting, two editors.
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
  const { t, toman, num } = useI18n();
  const [settings, setSettings] = useState<SettingsView | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.settings().then(setSettings).catch(() => {});
    api.cart().then((c) => setCartCount(c.count)).catch(() => {});
  }, []);

  const regionLabel = settings?.region_options.find((o) => o.code === settings.region)?.label;
  const initial = (settings?.display_name ?? settings?.email ?? "?").trim().charAt(0).toUpperCase();
  const max = settings?.budget_max_toman ?? DEFAULT_BUDGET_MAX_TOMAN;
  const budget = settings?.budget_ceiling_toman ?? null;
  const chipText = budget === null || budgetFromSlider(budget, max) === null ? t("nav.noBudget") : t("nav.upTo", { price: toman(budget) });

  return (
    <header className="nav" style={{ position: "sticky" }}>
      <nav className="nav-inner" aria-label={t("nav.main")}>
        <Link className="wordmark" href="/discover" aria-label="PlayNext">PlayNext</Link>
        <span className="spacer" />
        <Link className="item" href="/library" aria-label={t("nav.library")}><Icon name="library" /><span className="label">{t("nav.library")}</span></Link>
        <Link className="item" href="/wishlist" aria-label={t("nav.wishlist")}><Icon name="star" /><span className="label">{t("nav.wishlist")}</span></Link>
        <Link className="item" href="/dna" aria-label={t("nav.dna")}><Icon name="dna" /><span className="label">{t("nav.dna")}</span></Link>
        <Link className="item" href="/cart" aria-label={t("nav.cart")}><Icon name="cart" /><span className="label">{t("nav.cart")}</span>{cartCount > 0 && <span className="badge">{num(cartCount)}</span>}</Link>
        <button className="item budget-chip" aria-expanded={open} aria-controls="filters-menu" aria-label={t("nav.filters")} onClick={() => setOpen((o) => !o)}>
          <Icon name="filters" /><span className="label">{chipText}</span>
        </button>
        <Link className="item region-link" href="/settings" aria-label={t("nav.region")}><Icon name="globe" /><span className="label">{regionLabel ?? t("nav.regionFallback")}</span></Link>
        <LangToggle />
        <Link className="item" href="/settings" aria-label={t("nav.profile")}><span className="avatar">{initial}</span></Link>
      </nav>
      {open && settings && (
        <div id="filters-menu" className="popover" role="dialog" aria-label={t("nav.filters")}>
          <BudgetControl settings={settings} onSaved={(s) => { setSettings(s); onBudgetChange?.(); }} />
        </div>
      )}
    </header>
  );
}
