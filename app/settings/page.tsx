"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import BudgetControl from "@/components/BudgetControl";
import ConnectSteam from "@/components/ConnectSteam";
import LangToggle from "@/components/LangToggle";
import { useI18n } from "@/components/I18nProvider";
import { api } from "@/lib/api";
import type { Region, SettingsView } from "@/lib/types";

const PRIVACY_EMAIL = "playnextai@gmail.com";

// Settings: connected accounts, pricing region, budget (same value as the nav chip), language
// (this browser only) and the privacy note. Account deletion is by email during the beta.
export default function SettingsPage() {
  const { t, region: regionName } = useI18n();
  const [s, setS] = useState<SettingsView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { api.settings().then(setS).catch(() => setError(t("common.refresh"))); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setRegion(region: Region) {
    setError(null);
    setSaved(false);
    try { setS(await api.updateSettings({ region })); setSaved(true); } catch { setError(t("common.saveFailed")); }
  }

  return (
    <AppShell>
      <main className="container" style={{ paddingBottom: 64, maxWidth: 680 }}>
        <h1 className="page-title">{t("settings.title")}</h1>
        {error && <p className="error" role="alert">{error}</p>}
        {!s && !error && <p className="muted">{t("common.loading")}</p>}
        {s && (
          <div className="stack" style={{ gap: 20 }}>
            <section className="card stack" aria-label={t("settings.accounts")}>
              <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600 }}>{t("settings.accounts")}</h2>
              {s.email && <div style={{ display: "flex", justifyContent: "space-between" }}><span className="muted">{t("settings.emailAccount")}</span><span dir="ltr">{s.email}</span></div>}
              {s.steam_linked
                ? <div className="price">{t("settings.steamConnected")}</div>
                : <ConnectSteam variant="card" returnPath="/settings" />}
            </section>

            <section className="card stack" aria-label={t("settings.region")}>
              <label htmlFor="region" style={{ fontWeight: 600 }}>{t("settings.region")}</label>
              <select id="region" value={s.region ?? ""} onChange={(e) => setRegion(e.target.value as Region)}>
                <option value="" disabled>{t("nav.regionFallback")}</option>
                {s.region_options.map((o) => <option key={o.code} value={o.code}>{regionName(o.code, o.label)}</option>)}
              </select>
              {saved && <span className="price" role="status">{t("settings.saved")}</span>}
            </section>

            <section className="card"><BudgetControl settings={s} onSaved={setS} /></section>

            <section className="card stack" aria-label={t("settings.language")}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600 }}>{t("settings.language")}</span><LangToggle />
              </div>
              <span className="muted" style={{ fontSize: ".9rem" }}>{t("settings.languageNote")}</span>
            </section>

            <section className="card stack" aria-label={t("settings.privacy")}>
              <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600 }}>{t("settings.privacy")}</h2>
              <span className="muted">{t("settings.privacyNote", { email: PRIVACY_EMAIL })}</span>
            </section>
          </div>
        )}
      </main>
    </AppShell>
  );
}
