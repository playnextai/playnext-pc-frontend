"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import BudgetControl from "@/components/BudgetControl";
import Icon from "@/components/Icon";
import { useI18n } from "@/components/I18nProvider";
import { api } from "@/lib/api";
import { accountUrl, googleLinkUrl, logoutUrl, steamLinkUrl } from "@/lib/auth";
import type { Lang } from "@/lib/i18n";
import type { Region, SettingsView, SignInMethods } from "@/lib/types";

// Two visibly separate areas with separate owners (Global Auth hand-off):
//  - PlayNext:PC Settings: pricing region, budget, Steam library sync, language. Owned and saved by PC.
//  - PlayNext Account: sign-in methods, sessions, security. Owned by Global Auth; PC only links to it,
//    sends people to Auth to connect Steam, and signs out through Auth's logout.
export default function SettingsPage() {
  const { t, region: regionName, lang, setLang } = useI18n();
  const [s, setS] = useState<SettingsView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [methods, setMethods] = useState<SignInMethods | null>(null); // from Global Auth; null = unknown

  useEffect(() => { api.settings().then(setS).catch(() => setError(t("common.refresh"))); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { api.signInMethods().then(setMethods).catch(() => setMethods(null)); }, []);

  const steamIn = methods?.steam ?? s?.steam_linked ?? false; // Auth says which methods are linked; fall back to PC data

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
            <h2 className="set-title">{t("settings.pcTitle")}</h2>
            <p className="set-note" style={{ marginTop: 0 }}>{t("settings.pcNote")}</p>

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

            <h3 className="set-label">{t("settings.library")}</h3>
            <section className="set-group" aria-label={t("settings.library")}>
              <div className="set-row">
                <span className="dna-ic set-ic"><Icon name="refresh" /></span>
                <div className="set-text"><strong>{s.steam_linked ? t("settings.connected") : t("settings.notConnected")}</strong>
                  <span className="muted">{s.steam_linked ? t("settings.steamSynced") : t("settings.steamNote")}</span></div>
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

            <h2 className="set-title" style={{ marginTop: 40 }}>{t("settings.accountTitle")}</h2>
            <p className="set-note" style={{ marginTop: 0 }}>{t("settings.accountText")}</p>
            <section className="set-group" aria-label={t("settings.accountTitle")}>
              <div className="set-row">
                <span className="dna-ic set-ic"><Icon name="globe" /></span>
                <div className="set-text"><strong>{t("settings.googleSignIn")}</strong>
                  <span className="muted">{methods?.google == null ? t("settings.statusUnknown") : methods.google ? t("settings.connected") : t("settings.notConnected")}</span></div>
                {methods?.google === true && <span style={{ color: "var(--mint)", display: "inline-flex" }}><Icon name="check" /></span>}
                {methods?.google === false && <a className="btn secondary small" href={googleLinkUrl("/settings")}>{t("settings.connectGoogle")}</a>}
              </div>
              <div className="set-row">
                <span className="dna-ic set-ic"><Icon name="gamepad" /></span>
                <div className="set-text"><strong>{t("settings.signInMethod")}</strong><span className="muted">{steamIn ? t("settings.connected") : t("settings.notConnected")}</span></div>
                {steamIn
                  ? <span style={{ color: "var(--mint)", display: "inline-flex" }}><Icon name="check" /></span>
                  : <a className="btn secondary small" href={steamLinkUrl("/settings")}>{t("steam.connect")}</a>}
              </div>
              {s.email && (
                <div className="set-row">
                  <span className="dna-ic set-ic"><Icon name="mail" /></span>
                  <div className="set-text"><strong>{t("settings.signInEmail")}</strong><span className="muted" dir="ltr" style={{ textAlign: "start" }}>{s.email}</span></div>
                </div>
              )}
            </section>
            <a className="btn secondary" style={{ width: "100%", marginTop: 16 }} href={accountUrl()}>{t("settings.manageAccount")}</a>
            {/* Central logout must be a top-level form POST so Auth revokes the session and clears the shared cookie. */}
            <form method="post" action={logoutUrl()}>
              <button type="submit" className="btn secondary" style={{ width: "100%", marginTop: 12 }}>{t("settings.signOut")}</button>
            </form>
          </>
        )}
      </main>
    </AppShell>
  );
}
