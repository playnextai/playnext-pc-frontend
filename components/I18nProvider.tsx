"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LANG, detectLang, dirOf, formatInt, genreText, hoursText, nativeText, percentText, reasonText, regionKey, saveLang, tomanText, translate,
  type Key, type Lang,
} from "@/lib/i18n";

interface I18n {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (l: Lang) => void;
  t: (key: Key, vars?: Record<string, string | number>) => string;
  toman: (v: number | null | undefined) => string;
  native: (v: number | null | undefined, currency: string | null | undefined) => string | null;
  percent: (n: number) => string;
  hours: (n: number) => string;
  num: (n: number) => string;
  region: (code: string, fallback?: string) => string;
  genre: (g: string) => string;
  reason: (r: string | null | undefined) => string | null;
}

const Ctx = createContext<I18n | null>(null);

/** Holds the language for the whole app. The server renders English; on the client the saved choice
 *  (or the browser language) takes over right away and <html lang dir> follows it. The choice is
 *  stored in this browser only, as designed. */
export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => { setLangState(detectLang(typeof navigator === "undefined" ? null : navigator.language)); }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dirOf(lang);
  }, [lang]);

  const setLang = useCallback((l: Lang) => { setLangState(l); saveLang(l); }, []);

  const value = useMemo<I18n>(() => ({
    lang,
    dir: dirOf(lang),
    setLang,
    t: (key, vars) => translate(lang, key, vars),
    toman: (v) => tomanText(v, lang),
    native: (v, c) => nativeText(v, c, lang),
    percent: (n) => percentText(n, lang),
    hours: (n) => hoursText(n, lang),
    num: (n) => formatInt(n, lang),
    region: (code, fallback) => { const k = regionKey(code); return k ? translate(lang, k) : fallback ?? code; },
    genre: (g) => genreText(g, lang),
    reason: (r) => reasonText(r, lang),
  }), [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside <I18nProvider>");
  return v;
}
