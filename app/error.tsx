"use client";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import Icon from "@/components/Icon";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <main className="container" style={{ textAlign: "center", paddingTop: 96 }}>
      <span style={{ color: "var(--danger)" }}><Icon name="warn" className="icon" /></span>
      <h1 style={{ fontWeight: 600 }}>{t("state.errorTitle")}</h1>
      <p className="muted">{t("state.errorText")}</p>
      <p style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button className="btn" onClick={reset}>{t("common.tryAgain")}</button>
        <Link className="btn secondary" href="/discover">{t("state.toFeed")}</Link>
      </p>
    </main>
  );
}
