"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LangToggle from "@/components/LangToggle";
import { useI18n } from "@/components/I18nProvider";
import { api } from "@/lib/api";
import { signInUrl, steamSignInUrl } from "@/lib/auth";

// Logged-out landing page. Sign-in buttons are plain links to the auth site.
export default function Landing() {
  const router = useRouter();
  const { t } = useI18n();
  useEffect(() => {
    api.me().then((me) => { if (me.authenticated) router.replace("/discover"); }).catch(() => {});
  }, [router]);

  return (
    <main className="container" style={{ paddingTop: 24, textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}><LangToggle /></div>
      <div style={{ paddingTop: 40 }}>
        <img src="/brand/logo-controller-dark.png" alt="PlayNext" width={200} height={200} style={{ borderRadius: 24 }} />
        <h1 style={{ fontSize: "2.4rem", margin: "24px 0 8px", fontWeight: 600 }}>{t("landing.title")}</h1>
        <p className="muted" style={{ maxWidth: 520, margin: "0 auto 28px" }}>{t("landing.sub")}</p>
        <p style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a className="btn" href={steamSignInUrl("/discover")}>{t("landing.steam")}</a>
          <a className="btn secondary" href={signInUrl("/discover")}>{t("landing.email")}</a>
        </p>
      </div>
    </main>
  );
}
