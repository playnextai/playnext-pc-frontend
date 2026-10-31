"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { BUDGET_STEP_TOMAN, DEFAULT_BUDGET_MAX_TOMAN, budgetFromSlider, sliderFromBudget } from "@/lib/feed";
import { useI18n } from "@/components/I18nProvider";
import type { SettingsView } from "@/lib/types";

/** The one budget editor (nav popover and Settings both render it). Range is 0 .. the highest price in
 *  the database; the top of the slider means "no limit". Saves shortly after the person stops moving it. */
export default function BudgetControl({ settings, onSaved }: { settings: SettingsView; onSaved: (s: SettingsView) => void }) {
  const { t, toman } = useI18n();
  const max = settings.budget_max_toman ?? DEFAULT_BUDGET_MAX_TOMAN;
  const [pos, setPos] = useState(sliderFromBudget(settings.budget_ceiling_toman, max));
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => { setPos(sliderFromBudget(settings.budget_ceiling_toman, max)); }, [settings.budget_ceiling_toman, max]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function move(value: number) {
    setPos(value);
    setFailed(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try { onSaved(await api.updateSettings({ budget_ceiling_toman: budgetFromSlider(value, max) })); }
      catch { setFailed(true); }
    }, 400);
  }

  const label = budgetFromSlider(pos, max) === null ? t("settings.budgetNone") : toman(pos);
  return (
    <div className="stack">
      <label htmlFor="budget-range" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <span>{t("nav.budget")}</span><span className="price" aria-live="polite">{label}</span>
      </label>
      <input id="budget-range" type="range" min={0} max={max} step={BUDGET_STEP_TOMAN} value={pos}
        onChange={(e) => move(Number(e.target.value))} />
      {failed && <span className="error" role="alert">{t("common.saveFailed")}</span>}
    </div>
  );
}
