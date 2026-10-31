"use client";
import { useI18n } from "@/components/I18nProvider";

/** Switches English <-> Farsi. The button shows the OTHER language in its own script. Stored in this browser only. */
export default function LangToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <button className="lang-btn" onClick={() => setLang(lang === "fa" ? "en" : "fa")} aria-label={t("lang.label")} lang={lang === "fa" ? "en" : "fa"}>
      {t("lang.switch")}
    </button>
  );
}
