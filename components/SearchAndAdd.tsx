"use client";
import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { NO_RESULTS_COPY, normalizeQuery, shouldSearch } from "@/lib/search";
import type { SearchResult } from "@/lib/types";

/**
 * The one search-and-add component (game search -> dropdown -> add), shared by
 * onboarding manual entry, the Library page and the Wishlist page. It only
 * searches and adds; the parent owns the list of added games and removal.
 * `alreadyAddedIds` greys out rows the person has already added.
 */
export default function SearchAndAdd({ target, alreadyAddedIds, onAdded }: {
  target: "library" | "wishlist";
  alreadyAddedIds: ReadonlySet<number>;
  onAdded: (game: SearchResult) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const latest = useRef(0); // ignore responses from older keystrokes

  useEffect(() => {
    if (!shouldSearch(q)) { setResults(null); return; }
    const ticket = ++latest.current;
    const timer = setTimeout(() => {
      api.searchGames(normalizeQuery(q))
        .then((r) => { if (ticket === latest.current) { setResults(r.results); setError(null); } })
        .catch(() => { if (ticket === latest.current) setError("Search is unavailable right now."); });
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  async function add(game: SearchResult) {
    setBusyId(game.game_id);
    setError(null);
    try {
      if (target === "library") await api.addToLibrary(game.game_id);
      else await api.addToWishlist(game.game_id);
      onAdded(game);
      setQ("");
      setResults(null);
    } catch (e) {
      setError(e instanceof ApiError && e.isRateLimited ? "Slow down a little and try again." : "Could not add that game. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={target === "library" ? "Search for a game you own…" : "Search for a game you want…"}
        aria-label="Search games"
      />
      {error && <p className="error">{error}</p>}
      {results && (
        <ul className="card" style={{ listStyle: "none", margin: "8px 0 0", padding: 8, position: "absolute", left: 0, right: 0, zIndex: 5 }}>
          {results.length === 0 && <li className="muted" style={{ padding: 8 }}>{NO_RESULTS_COPY}</li>}
          {results.map((g) => {
            const added = alreadyAddedIds.has(g.game_id);
            return (
              <li key={g.game_id}>
                <button
                  disabled={added || busyId === g.game_id}
                  onClick={() => add(g)}
                  style={{ all: "unset", display: "flex", gap: 10, alignItems: "center", width: "100%", padding: 8, cursor: added ? "default" : "pointer", opacity: added ? 0.5 : 1 }}
                >
                  {g.cover_url && <img src={g.cover_url} alt="" width={36} height={50} style={{ borderRadius: 6 }} />}
                  <span style={{ flex: 1 }}>
                    <strong>{g.title}</strong>
                    <span className="muted" style={{ display: "block", fontSize: ".85rem" }}>
                      {[g.developer, g.release_year].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="muted">{added ? "Added" : "Add"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
