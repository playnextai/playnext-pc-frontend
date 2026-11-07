"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Gate from "@/components/Gate";
import SearchAndAdd from "@/components/SearchAndAdd";
import Playtime from "@/components/Playtime";
import { api } from "@/lib/api";
import type { PlaytimeBucket, SearchResult } from "@/lib/types";
import { useI18n } from "@/components/I18nProvider";
import Icon from "@/components/Icon";

const HEART_RATING = 5; // stored with the game; the recommender does not use ratings yet

// Library step (3 of 3): search-and-add for games on stores we can't read. Each added game has a one-tap
// playtime gauge (not set -> barely touched -> some hours -> 50+ hours -> not set), an optional heart and a
// remove button. Skip link at the top; a bottom bar counts what was added.
export default function LibraryStep() {
  const { t } = useI18n();
  const router = useRouter();
  const [steamLinked, setSteamLinked] = useState<boolean | null>(null);
  const [added, setAdded] = useState<SearchResult[]>([]);
  const [bucket, setBucket] = useState<Record<number, PlaytimeBucket | null>>({});
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

  async function cycle(id: number) {
    try {
      const r = (await api.cyclePlaytime(id)) as { playtime_bucket: PlaytimeBucket | null };
      setBucket((m) => ({ ...m, [id]: r.playtime_bucket }));
    } catch { setError(t("library.cycleFailed")); }
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
      <main className="container" style={{ maxWidth: 860, paddingTop: 28, paddingBottom: 112 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }} className="muted">
          <span>{t("region.step", { n: 3 })}</span>
          <button disabled={busy} onClick={finish} className="link-btn">{t("quiz.skip")}</button>
        </div>
        <h1 style={{ textAlign: "center", fontWeight: 600, margin: "20px 0 8px" }}>{steamLinked ? t("add.titleSteam") : t("add.title")}</h1>
        <p className="muted" style={{ textAlign: "center", margin: "0 0 28px", lineHeight: 1.7 }}>{steamLinked ? t("add.subSteam") : t("add.subEmail")}</p>
        <SearchAndAdd target="library" alreadyAddedIds={ids} onAdded={(g) => setAdded((a) => [...a, g])} />
        {error && <p className="error" role="alert">{error}</p>}
        <ul style={{ listStyle: "none", padding: 0, margin: "20px 0", display: "grid", gap: 10 }}>
          {added.map((g) => (
            <li key={g.game_id} className="card" style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 16px", borderRadius: 14 }}>
              {g.cover_url ? <img src={g.cover_url} alt="" width={44} height={56} style={{ borderRadius: 8, objectFit: "cover" }} /> : <span style={{ width: 44, height: 56, borderRadius: 8, background: "var(--cover)", flex: "none" }} />}
              <span style={{ flex: 1, minWidth: 0 }} dir="auto">{g.title}</span>
              <Playtime bucket={bucket[g.game_id] ?? null} onCycle={() => cycle(g.game_id)} />
              <button className="icon-btn" aria-label={t("add.loved")} aria-pressed={hearted.has(g.game_id)} onClick={() => heart(g.game_id)}
                style={{ color: hearted.has(g.game_id) ? "var(--mint)" : undefined }}><Icon name="heart" /></button>
              <button className="icon-btn" aria-label={t("common.remove")} onClick={() => remove(g.game_id)}><Icon name="trash" /></button>
            </li>
          ))}
        </ul>
        <p className="muted" style={{ textAlign: "center", fontSize: ".9rem" }}>{t("add.hint")}</p>

        <div className="quiz-bar">
          <span aria-live="polite" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {added.length > 0 && <span style={{ color: "var(--mint)", display: "inline-flex" }}><Icon name="check" /></span>}
            {added.length > 0 ? t("add.count", { n: added.length }) : t("add.countNone")}
          </span>
          <button className="btn" disabled={busy} onClick={finish}>{t("common.continue")}</button>
        </div>
      </main>
    </Gate>
  );
}
