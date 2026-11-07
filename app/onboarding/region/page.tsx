"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Gate from "@/components/Gate";
import SkeletonRows from "@/components/Skeleton";
import { useI18n } from "@/components/I18nProvider";
import { api, ApiError } from "@/lib/api";
import type { Region, SettingsView } from "@/lib/types";

const CURRENCY: Record<Region, string> = { US: "USD $", UK: "GBP £", EU: "EUR €", UA: "UAH ₴", TR: "TRY ₺", AR: "ARS $" };

// Required onboarding step: without a pricing region the whole app has no prices.
// The same choice can be changed later in /settings. Six regions, one radio list (as designed).
export default function RegionStep() {
  const { t, region: regionName } = useI18n();
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsView | null>(null);
  const [region, setRegion] = useState<Region | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.settings().then((s) => { setSettings(s); if (s.region) setRegion(s.region); }).catch(() => setError(t("region.loadFailed")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!region) return;
    setBusy(true);
    setError(null);
    try {
      await api.updateSettings({ region });
      const status = await api.onboardingStatus();
      router.replace(status.next_route ?? "/discover");
    } catch (e) {
      setError(e instanceof ApiError && e.code === "invalid_region" ? t("region.invalid") : t("common.saveFailed"));
      setBusy(false);
    }
  }

  return (
    <Gate>
      <main className="container" style={{ maxWidth: 600, paddingTop: 36, paddingBottom: 40 }}>
        <div className="muted">{t("region.step", { n: 1 })}</div>
        <h1 style={{ textAlign: "center", margin: "20px 0 8px", fontWeight: 600 }}>{t("region.title")}</h1>
        <p className="muted" style={{ textAlign: "center", margin: "0 0 28px", lineHeight: 1.7 }}>{t("region.sub")}</p>
        {!settings && !error && <SkeletonRows n={6} />}
        <div role="radiogroup" aria-label={t("nav.region")} className="stack">
          {settings?.region_options.map((o) => {
            const on = region === o.code;
            return (
              <button key={o.code} role="radio" aria-checked={on} onClick={() => setRegion(o.code)} className={`region-opt${on ? " on" : ""}`}>
                <span style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <span aria-hidden="true" className="region-dot" />
                  {regionName(o.code, o.label)}
                </span>
                <span className="muted" style={{ fontSize: ".9rem" }}>{CURRENCY[o.code]}</span>
              </button>
            );
          })}
        </div>
        <p className="muted" style={{ fontSize: ".9rem", lineHeight: 1.6, margin: "20px 0 0" }}>{t("region.note")}</p>
        {error && <p className="error" role="alert">{error}</p>}
        <p style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}><button className="btn" disabled={!region || busy} onClick={save}>{t("common.continue")}</button></p>
      </main>
    </Gate>
  );
}
