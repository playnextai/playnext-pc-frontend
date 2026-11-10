"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import BudgetControl from "@/components/BudgetControl";
import Icon from "@/components/Icon";
import { useI18n } from "@/components/I18nProvider";
import { api } from "@/lib/api";
import { steamSignInUrl } from "@/lib/auth";
import type { Lang } from "@/lib/i18n";
import type { Region, SettingsView } from "@/lib/types";

const PRIVACY_EMAIL = "playnextai@gmail.com";

// Settings: connected accounts, pricing region, budget (same value as the nav chip), language
// (this browser only) and the privacy note. Account deletion is by email during the beta.
export default function SettingsPage() {
  const { t, region: regionName, lang, setLang } = useI18n();
  const [s, setS] = useState<SettingsView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { api.settings().then(setS).catch(() => setError(t("common.refresh"))); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    try { await api.logout(); } catch { /* the cookie may already be gone; leave either way */ }
    window.location.href = "/";
  }

  async function setRegion(region: Region) {
    setError(null);
    setSaved(false);
    try { setS(await api.updateSettings({ region })); setSaved(true); } catch { setError(t("common.saveFailed")); }
  }

  return (
    <AppShell>
      <main className="container" style={{ paddingBottom: 64, maxWidth: 680 }}>
        <h1 className="page-title" style={{ fontSize: "2rem", margin: "28px 0 8px" }}>{t("settings.title")}</h1>
        {error && <p className="error" role="alert">{error}</p>}
        {!s && !error && <p className="muted">{t("common.loading")}</p>}
        {s && (
          <>
            <h2 className="set-label">{t("settings.accounts")}</h2>
            <section className="set-group" aria-label={t("settings.accounts")}>
              <div className="set-row">
                <span className="dna-ic set-ic"><Icon name="gamepad" /></span>
                <div className="set-text"><strong>Steam</strong><span className="muted">{s.steam_linked ? t("settings.connected") : t("settings.notConnected")}</span></div>
                {s.steam_linked
                  ? <span style={{ color: "var(--mint)", display: "inline-flex" }}><Icon name="check" /></span>
                  : <a className="btn secondary small" href={steamSignInUrl("/settings")}>{t("steam.connect")}</a>}
              </div>
              {s.email && (
                <div className="set-row">
                  <span className="dna-ic set-ic"><Icon name="mail" /></span>
                  <div className="set-text"><strong>{t("settings.emailAccount")}</strong><span className="muted" dir="ltr" style={{ textAlign: "start" }}>{s.email}</span></div>
                </div>
              )}
            </section>
            <p className="set-note" style={s.steam_linked ? { color: "var(--mint)" } : undefined}>{s.steam_linked ? t("settings.steamSynced") : t("settings.steamNote")}</p>

            <h2 className="set-label">{t("settings.pricing")}</h2>
            <section className="set-group" aria-label={t("settings.pricing")}>
              <div className="set-row">
                <div className="set-text"><label htmlFor="region" style={{ fontWeight: 600 }}>{t("settings.region")}</label><span className="muted">{t("settings.regionHint")}</span></div>
                <select id="region" className="set-select" value={s.region ?? ""} onChange={(e) => setRegion(e.target.value as Region)}>
                  <option value="" disabled>{t("nav.regionFallback")}</option>
                  {s.region_options.map((o) => <option key={o.code} value={o.code}>{regionName(o.code, o.label)}</option>)}
                </select>
              </div>
              {saved && <div className="set-row"><span className="price" role="status">{t("settings.saved")}</span></div>}
              <div className="set-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
                <div className="set-text"><strong>{t("settings.budgetTitle")}</strong><span className="muted">{t("settings.budgetHint")}</span></div>
                <BudgetControl settings={s} onSaved={setS} />
              </div>
            </section>

            <h2 className="set-label">{t("settings.language")}</h2>
            <section className="set-group" aria-label={t("settings.language")}>
              <div className="set-row">
                <div className="set-text"><label htmlFor="ui-lang" style={{ fontWeight: 600 }}>{t("settings.languageTitle")}</label><span className="muted">{t("settings.languageNote")}</span></div>
                <select id="ui-lang" className="set-select" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
                  <option value="en" lang="en">English</option>
                  <option value="fa" lang="fa">فارسی</option>
                </select>
              </div>
            </section>

            <h2 className="set-label">{t("settings.privacy")}</h2>
            <section className="set-group" aria-label={t("settings.privacy")}>
              <div className="set-row"><div className="set-text"><strong>{t("settings.yourData")}</strong><span className="muted">{t("settings.privacyNote", { email: PRIVACY_EMAIL })}</span></div></div>
            </section>

            <button className="btn secondary" style={{ width: "100%", marginTop: 24 }} onClick={signOut}>{t("settings.signOut")}</button>
          </>
        )}
      </main>
    </AppShell>
  );
}
