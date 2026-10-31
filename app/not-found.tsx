"use client";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

export default function NotFound() {
  const { t, lang } = useI18n();
  return (
    <main className="container" style={{ textAlign: "center", paddingTop: 96 }}>
      <div style={{ fontSize: "3.5rem", fontWeight: 700, background: "var(--brand)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{lang === "fa" ? "۴۰۴" : "404"}</div>
      <h1 style={{ fontWeight: 600 }}>{t("state.notFoundTitle")}</h1>
      <p className="muted">{t("state.notFoundText")}</p>
      <Link className="btn" href="/discover">{t("state.toFeed")}</Link>
    </main>
  );
}
