"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
import LangToggle from "@/components/LangToggle";
import { useI18n } from "@/components/I18nProvider";
import { api } from "@/lib/api";
import { AUTH_URL, signInUrl } from "@/lib/auth";
import type { Key } from "@/lib/i18n";

const HOW: { icon: IconName; t: Key; d: Key }[] = [
  { icon: "link", t: "lp.how1t", d: "lp.how1d" },
  { icon: "clock", t: "lp.how2t", d: "lp.how2d" },
  { icon: "target", t: "lp.how3t", d: "lp.how3d" },
];
const FEATURES: { icon: IconName; t: Key; d: Key }[] = [
  { icon: "message", t: "lp.f1t", d: "lp.f1d" },
  { icon: "tag", t: "lp.f2t", d: "lp.f2d" },
  { icon: "layers", t: "lp.f3t", d: "lp.f3d" },
  { icon: "bookmark", t: "lp.f4t", d: "lp.f4d" },
];
const CONTACT_EMAIL = "playnextai@gmail.com";

// Logged-out landing page (designed in the catalog, English + Farsi). Every sign-in control is a plain
// link to the shared auth site with a return_url; this app never shows a sign-in form.
export default function Landing() {
  const router = useRouter();
  const { t, percent, genre } = useI18n();
  useEffect(() => {
    api.me().then((me) => { if (me.authenticated) router.replace("/discover"); }).catch(() => {});
  }, [router]);

  const login = signInUrl(); // central Auth login; Google, Steam and email are chosen there

  return (
    <div className="container landing">
      <header className="lp-nav">
        <span className="wordmark" style={{ fontSize: "1.6rem" }}>PlayNext</span>
        <nav className="lp-links" aria-label={t("nav.main")}>
          <a className="lp-link" href="#how">{t("lp.navHow")}</a>
          <a className="lp-link" href="#feat">{t("lp.navFeatures")}</a>
          <LangToggle />
          <a className="btn secondary small" href={login}>{t("lp.signIn")}</a>
        </nav>
      </header>

      <main>
        <section className="lp-hero">
          <h1>{t("lp.h1a")}<span className="accent">{t("lp.h1b")}</span>{t("lp.h1c")}</h1>
          <p className="muted lp-sub">{t("lp.sub")}</p>
          <a className="btn lp-cta" href={login}>{t("auth.continue")}</a>
          <div className="muted" style={{ fontSize: ".9rem" }}>{t("auth.sub")}</div>
          <div className="muted" style={{ fontSize: ".9rem" }}>
            <a href={AUTH_URL} className="lp-inline" style={{ color: "var(--text)" }} dir="ltr">{AUTH_URL.replace(/^https?:\/\//, "")}</a>
          </div>
        </section>

        <section className="card lp-examples" aria-label={t("lp.example")}>
          <div className="muted" style={{ fontSize: ".8rem", marginBottom: 12 }}>{t("lp.example")}</div>
          <div className="lp-ex-row">
            <div className="card lp-ex"><div className="lp-cv">Dead Cells</div><div>{t("lp.match", { n: 92, genre: genre("Roguelike") })}</div></div>
            <div className="card lp-ex"><div className="lp-cv">Hyper Light Drifter</div><div>{t("lp.match", { n: 88, genre: genre("Action") })}</div></div>
            <div className="card lp-ex" style={{ opacity: 0.7 }}><div className="lp-cv muted">{t("lp.more")}</div><div className="muted">{t("lp.seeYours")}</div></div>
          </div>
        </section>

        <section id="how" className="lp-section">
          <h2>{t("lp.how")}</h2>
          <div className="lp-three">
            {HOW.map((s) => (
              <div key={s.t} className="lp-step">
                <span className="lp-ib"><Icon name={s.icon} /></span>
                <b>{t(s.t)}</b>
                <span className="muted">{t(s.d)}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="feat" className="lp-two" aria-label={t("lp.navFeatures")}>
          {FEATURES.map((f) => (
            <div key={f.t} className="card" style={{ display: "flex", gap: 16, padding: 22 }}>
              <span style={{ color: "var(--mint)", marginTop: 2 }}><Icon name={f.icon} /></span>
              <div><b style={{ fontSize: "1.05rem" }}>{t(f.t)}</b><div className="muted" style={{ marginTop: 6, lineHeight: 1.6 }}>{t(f.d)}</div></div>
            </div>
          ))}
        </section>

        <section className="card lp-final">
          <h2>{t("brand.tagline")}</h2>
          <div className="muted">{t("lp.ctaSub")}</div>
          <a className="btn lp-cta" href={login}>{t("auth.continue")}</a>
        </section>
      </main>

      <footer className="lp-foot muted">
        <span>© PlayNext</span>
        <a href={`mailto:${CONTACT_EMAIL}`} className="lp-inline" style={{ color: "var(--muted)" }}>{t("lp.contact")}</a>
      </footer>
    </div>
  );
}
