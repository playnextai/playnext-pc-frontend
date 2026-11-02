"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Gate from "@/components/Gate";
import SearchAndAdd from "@/components/SearchAndAdd";
import { api } from "@/lib/api";
import type { PlaytimeBucket, SearchResult } from "@/lib/types";
import { useI18n } from "@/components/I18nProvider";
import Icon from "@/components/Icon";

const HEART_RATING = 5; // stored with the game; the recommender does not use ratings yet

// Manual entry: search-and-add, an added list with remove and an optional heart, skip link.
// Copy differs for Steam-linked people (a Steam library is synced separately) and email-only people.
export default function LibraryStep() {
  const { t } = useI18n();
  const router = useRouter();
  const [steamLinked, setSteamLinked] = useState<boolean | null>(null);
  const [added, setAdded] = useState<SearchResult[]>([]);
  const [bucket, setBucket] = useState<Record<number, PlaytimeBucket>>({});
  const [hearted, setHearted] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ids = useMemo(() => new Set(added.map((g) => g.game_id)), [added]);

  useEffect(() => { api.settings().then((s) => setSteamLinked(s.steam_linked)).catch(() => setSteamLinked(false)); }, []);

  async function remove(id: number) {
    try {
      await api.removeFromLibrary(id);
      setBucket((m) => { const n = { ...m }; delete n[id]; return n; });
      setAdded((a) => a.filter((g) => g.game_id !== id));
      setHearted((h) => { const n = new Set(h); n.delete(id); return n; });
    } catch { setError(t("add.removeFailed")); }
  }

  async function setPlaytime(id: number, b: PlaytimeBucket) {
    try { await api.addToLibrary(id, b); setBucket((m) => ({ ...m, [id]: b })); }
    catch { setError(t("common.saveFailed")); }
  }

  async function heart(id: number) {
    if (hearted.has(id)) return; // the backend can set a rating but not clear it
    try {
      await api.addToLibrary(id, undefined, HEART_RATING);
      setHearted((h) => new Set(h).add(id));
    } catch { setError(t("common.saveFailed")); }
  }

  async function finish() {
    setBusy(true);
    try {
      const status = await api.completeStep("library");
      router.replace(status.next_route ?? "/discover");
    } catch { setError(t("add.continueFailed")); setBusy(false); }
  }

  return (
    <Gate>
      <main className="container" style={{ maxWidth: 640, paddingTop: 32 }}>
        <h1 style={{ fontWeight: 600 }}>{t("add.title")}</h1>
        <p className="muted">
          {steamLinked ? t("add.subSteam") : t("add.subEmail")}
        </p>
        <SearchAndAdd target="library" alreadyAddedIds={ids} onAdded={(g) => setAdded((a) => [...a, g])} />
        {error && <p className="error">{error}</p>}
        <ul style={{ listStyle: "none", padding: 0, marginTop: 24, display: "grid", gap: 8 }}>
          {added.map((g) => (
            <li key={g.game_id} className="card" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              {g.cover_url ? <img src={g.cover_url} alt="" width={36} height={50} style={{ borderRadius: 6 }} /> : <span style={{ width: 36, height: 50, borderRadius: 6, background: "var(--cover)", flex: "none" }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{g.title}</strong>
                <div role="radiogroup" aria-label={t("add.gauge")} style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  {(["barely_touched", "some_hours", "sunk_50plus"] as const).map((b) => (
                    <button key={b} role="radio" aria-checked={bucket[g.game_id] === b} onClick={() => setPlaytime(g.game_id, b)} className="tab"
                      style={{ minHeight: 32, padding: "0 12px", fontSize: ".85rem", ...(bucket[g.game_id] === b ? { background: "var(--surface-2)", color: "var(--text)", borderColor: "var(--mint)" } : {}) }}>
                      {t(`library.bucket.${b}`)}
                    </button>
                  ))}
                </div>
              </div>
              <button aria-label={t("add.loved")} aria-pressed={hearted.has(g.game_id)} onClick={() => heart(g.game_id)}
                style={{ background: "none", border: 0, cursor: "pointer", color: hearted.has(g.game_id) ? "var(--mint)" : "var(--muted)", display: "inline-flex" }}><Icon name="heart" /></button>
              <button className="btn secondary" onClick={() => remove(g.game_id)}>{t("common.remove")}</button>
            </li>
          ))}
        </ul>
        <p style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button className="btn" disabled={busy} onClick={finish}>{added.length ? t("add.done") : t("common.continue")}</button>
          {added.length === 0 && <button className="btn secondary" disabled={busy} onClick={finish}>{t("add.skipNow")}</button>}
        </p>
      </main>
    </Gate>
  );
}
