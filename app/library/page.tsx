"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Empty from "@/components/Empty";
import SearchAndAdd from "@/components/SearchAndAdd";
import SyncBanner from "@/components/SyncBanner";
import Thumb from "@/components/Thumb";
import Playtime from "@/components/Playtime";
import Icon from "@/components/Icon";
import { steamLinkUrl } from "@/lib/auth";
import SkeletonRows from "@/components/Skeleton";
import { useI18n } from "@/components/I18nProvider";
import { api } from "@/lib/api";
import type { LibraryItem } from "@/lib/types";

type Tab = "all" | "synced" | "manual";

// My Library: tabs (All / From Steam / Added by me), search-and-add, rows with playtime.
// Manual games show a playtime bucket the person can cycle; synced games show real hours.
export default function LibraryPage() {
  const { t, hours, num } = useI18n();
  const [tab, setTab] = useState<Tab>("all");
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ n: number; s: number; m: number } | null>(null);
  const [steamLinked, setSteamLinked] = useState<boolean | null>(null);
  useEffect(() => { api.settings().then((x) => setSteamLinked(x.steam_linked)).catch(() => {}); }, []);

  const load = useCallback(async (which: Tab) => {
    try {
      const list = (await api.library(which)).items;
      setItems(list);
      if (which === "all") setCounts({ n: list.length, s: list.filter((x) => !x.removable).length, m: list.filter((x) => x.removable).length });
    } catch { setError(t("common.refresh")); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { load(tab); }, [tab, load]);

  const ids = useMemo(() => new Set((items ?? []).map((i) => i.game_id)), [items]);

  async function remove(id: number) {
    try {
      await api.removeFromLibrary(id);
      setItems((l) => l && l.filter((i) => i.game_id !== id));
      setCounts((c) => c && { n: c.n - 1, s: c.s, m: c.m - 1 });
    }
    catch { setError(t("library.removeFailed")); }
  }
  async function cycle(id: number) {
    try {
      const r = (await api.cyclePlaytime(id)) as { playtime_bucket: LibraryItem["playtime_bucket"] };
      setItems((l) => l && l.map((x) => (x.game_id === id ? { ...x, playtime_bucket: r.playtime_bucket } : x)));
    } catch { setError(t("library.cycleFailed")); }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: t("library.tabAll") },
    { id: "synced", label: t("library.tabSynced") },
    { id: "manual", label: t("library.tabManual") },
  ];

  return (
    <AppShell>
      <main className="container" style={{ paddingBottom: 64, maxWidth: 860 }}>
        <h1 className="page-title" style={{ fontSize: "2rem", margin: "28px 0 4px" }}>{t("library.title")}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {counts && counts.n > 0 ? t("library.summary", { n: counts.n, s: counts.s, m: counts.m }) : counts ? t("library.summaryNone") : "\u00a0"}
        </p>
        <SyncBanner onFinished={() => { load(tab); }} />
        <div className="tabs" role="tablist" style={{ margin: "20px 0" }}>
          {tabs.map((x) => <button key={x.id} role="tab" className="tab" aria-selected={tab === x.id} onClick={() => setTab(x.id)}>{x.label}</button>)}
        </div>
        <SearchAndAdd target="library" alreadyAddedIds={ids} onAdded={() => { load(tab); }} />
        {error && <p className="error" role="alert">{error}</p>}
        {items === null && !error && <SkeletonRows />}
        {items && items.length === 0 && (
          <div style={{ marginTop: 24 }}>
            <Empty icon="library" title={t("library.empty")} text={t("library.emptySub")}>
              {steamLinked === false && <a className="btn" href={steamLinkUrl("/library")}>{t("steam.connect")}</a>}
            </Empty>
          </div>
        )}
        <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 0", display: "grid", gap: 10 }}>
          {items?.map((g) => (
            <li key={g.game_id} className="card" style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 16px", borderRadius: 14 }}>
              <Thumb url={g.cover_url} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link href={`/game/${g.game_id}`} className="link-title" dir="auto">{g.title}</Link>
                <div className="muted" style={{ fontSize: ".9rem" }}>
                  {g.playtime_hours !== null ? t("library.hours", { h: hours(Math.round(g.playtime_hours)) })
                    : g.playtime_bucket ? t(`library.bucket.${g.playtime_bucket}`) : ""}
                </div>
              </div>
              {g.removable ? (
                <>
                  <span className="muted lib-tag">{t("library.addedByYou")}</span>
                  <Playtime bucket={g.playtime_bucket} onCycle={() => cycle(g.game_id)} />
                  <button className="icon-btn" aria-label={`${t("common.remove")}: ${g.title}`} onClick={() => remove(g.game_id)}><Icon name="trash" /></button>
                </>
              ) : (
                <span className="chip lib-chip"><Icon name="refresh" className="icon-sm" />{t("library.synced")}</span>
              )}
            </li>
          ))}
        </ul>
        {items && items.length > 0 && <p className="muted" style={{ fontSize: ".9rem", lineHeight: 1.7, margin: "20px 0 0" }}>{t("library.note")}</p>}
      </main>
    </AppShell>
  );
}
