"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Gate from "@/components/Gate";
import SearchAndAdd from "@/components/SearchAndAdd";
import { api } from "@/lib/api";
import type { SearchResult } from "@/lib/types";

const HEART_RATING = 5; // stored with the game; the recommender does not use ratings yet

// Manual entry: search-and-add, an added list with remove and an optional heart, skip link.
// Copy differs for Steam-linked people (a Steam library is synced separately) and email-only people.
export default function LibraryStep() {
  const router = useRouter();
  const [steamLinked, setSteamLinked] = useState<boolean | null>(null);
  const [added, setAdded] = useState<SearchResult[]>([]);
  const [hearted, setHearted] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ids = useMemo(() => new Set(added.map((g) => g.game_id)), [added]);

  useEffect(() => { api.settings().then((s) => setSteamLinked(s.steam_linked)).catch(() => setSteamLinked(false)); }, []);

  async function remove(id: number) {
    try {
      await api.removeFromLibrary(id);
      setAdded((a) => a.filter((g) => g.game_id !== id));
      setHearted((h) => { const n = new Set(h); n.delete(id); return n; });
    } catch { setError("Could not remove that game."); }
  }

  async function heart(id: number) {
    if (hearted.has(id)) return; // the backend can set a rating but not clear it
    try {
      await api.addToLibrary(id, undefined, HEART_RATING);
      setHearted((h) => new Set(h).add(id));
    } catch { setError("Could not save that."); }
  }

  async function finish() {
    setBusy(true);
    try {
      const status = await api.completeStep("library");
      router.replace(status.next_route ?? "/discover");
    } catch { setError("Could not continue. Try again."); setBusy(false); }
  }

  return (
    <Gate>
      <main className="container" style={{ maxWidth: 640, paddingTop: 32 }}>
        <h1>Add games you've played</h1>
        <p className="muted">
          {steamLinked
            ? "Your Steam library is being imported. You can also add games from other stores here."
            : "Search for games you own or have played, on any store. The more you add, the better your picks."}
        </p>
        <SearchAndAdd target="library" alreadyAddedIds={ids} onAdded={(g) => setAdded((a) => [...a, g])} />
        {error && <p className="error">{error}</p>}
        <ul style={{ listStyle: "none", padding: 0, marginTop: 24, display: "grid", gap: 8 }}>
          {added.map((g) => (
            <li key={g.game_id} className="card" style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {g.cover_url && <img src={g.cover_url} alt="" width={36} height={50} style={{ borderRadius: 6 }} />}
              <strong style={{ flex: 1 }}>{g.title}</strong>
              <button aria-label="Loved it" aria-pressed={hearted.has(g.game_id)} onClick={() => heart(g.game_id)}
                style={{ background: "none", border: 0, cursor: "pointer", fontSize: "1.2rem", color: hearted.has(g.game_id) ? "var(--violet)" : "var(--muted)" }}>♥</button>
              <button className="btn secondary" onClick={() => remove(g.game_id)}>Remove</button>
            </li>
          ))}
        </ul>
        <p style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button className="btn" disabled={busy} onClick={finish}>{added.length ? "Done" : "Continue"}</button>
          {added.length === 0 && <button className="btn secondary" disabled={busy} onClick={finish}>Skip for now</button>}
        </p>
      </main>
    </Gate>
  );
}
