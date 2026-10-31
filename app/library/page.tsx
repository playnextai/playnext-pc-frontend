"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Empty from "@/components/Empty";
import SearchAndAdd from "@/components/SearchAndAdd";
import SyncBanner from "@/components/SyncBanner";
import Thumb from "@/components/Thumb";
import { useI18n } from "@/components/I18nProvider";
import { api } from "@/lib/api";
import type { LibraryItem } from "@/lib/types";

type Tab = "all" | "synced" | "manual";

// My Library: tabs (All / From Steam / Added by me), search-and-add, rows with playtime.
// Manual games show a playtime bucket the person can cycle; synced games show real hours.
export default function LibraryPage() {
  const { t, hours } = useI18n();
  const [tab, setTab] = useState<Tab>("all");
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (which: Tab) => {
    try { setItems((await api.library(which)).items); } catch { setError(t("common.refresh")); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { load(tab); }, [tab, load]);

  const ids = useMemo(() => new Set((items ?? []).map((i) => i.game_id)), [items]);

  async function remove(id: number) {
    try { await api.removeFromLibrary(id); setItems((l) => l && l.filter((i) => i.game_id !== id)); }
    catch { setError(t("library.removeFailed")); }
  }
  async function cycle(id: number) {
    try { await api.cyclePlaytime(id); await load(tab); } catch { setError(t("library.cycleFailed")); }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: t("library.tabAll") },
    { id: "synced", label: t("library.tabSynced") },
    { id: "manual", label: t("library.tabManual") },
  ];

  return (
    <AppShell>
      <main className="container" style={{ paddingBottom: 64, maxWidth: 820 }}>
        <h1 className="page-title">{t("library.title")}</h1>
        <SyncBanner onFinished={() => { load(tab); }} />
        <div className="tabs" role="tablist" style={{ margin: "16px 0" }}>
          {tabs.map((x) => <button key={x.id} role="tab" className="tab" aria-selected={tab === x.id} onClick={() => setTab(x.id)}>{x.label}</button>)}
        </div>
        <SearchAndAdd target="library" alreadyAddedIds={ids} onAdded={() => { load(tab); }} />
        {error && <p className="error" role="alert">{error}</p>}
        {items === null && !error && <p className="muted">{t("common.loading")}</p>}
        {items && items.length === 0 && (
          <div style={{ marginTop: 24 }}><Empty icon="library" title={t("library.empty")} text={t("library.emptySub")} /></div>
        )}
        <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0", display: "grid", gap: 10 }}>
          {items?.map((g) => (
            <li key={g.game_id} className="card" style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <Thumb url={g.cover_url} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/game/${g.game_id}`} style={{ color: "var(--text)", fontWeight: 600, textDecoration: "none" }}>{g.title}</Link>
                <div className="muted" style={{ fontSize: ".9rem" }}>
                  {g.playtime_hours !== null ? t("library.hours", { h: hours(Math.round(g.playtime_hours)) })
                    : g.playtime_bucket ? t(`library.bucket.${g.playtime_bucket}`) : ""}
                </div>
              </div>
              {g.removable && g.playtime_bucket && (
                <button className="btn secondary small" onClick={() => cycle(g.game_id)} aria-label={t("library.playtime")}>{t(`library.bucket.${g.playtime_bucket}`)}</button>
              )}
              {g.removable && <button className="btn secondary small" onClick={() => remove(g.game_id)}>{t("common.remove")}</button>}
            </li>
          ))}
        </ul>
      </main>
    </AppShell>
  );
}
