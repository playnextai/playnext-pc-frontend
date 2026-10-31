"use client";
import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { normalizeQuery, shouldSearch } from "@/lib/search";
import { useI18n } from "@/components/I18nProvider";
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
  const { t } = useI18n();
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
        .catch(() => { if (ticket === latest.current) setError(t("search.unavailable")); });
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
      setError(e instanceof ApiError && e.isRateLimited ? t("search.slowDown") : t("search.addFailed"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={target === "library" ? t("search.placeholderLibrary") : t("search.placeholderWishlist")}
        aria-label={t("search.label")}
      />
      {error && <p className="error">{error}</p>}
      {results && (
        <ul className="card" style={{ listStyle: "none", margin: "8px 0 0", padding: 8, position: "absolute", insetInline: 0, zIndex: 5 }}>
          {results.length === 0 && <li className="muted" style={{ padding: 8 }}>{t("search.noResults")}</li>}
          {results.map((g) => {
            const added = alreadyAddedIds.has(g.game_id);
            return (
              <li key={g.game_id}>
                <button
                  disabled={added || busyId === g.game_id}
                  onClick={() => add(g)}
                  style={{ all: "unset", display: "flex", gap: 10, alignItems: "center", width: "100%", padding: 8, cursor: added ? "default" : "pointer", opacity: added ? 0.5 : 1 }}
                >
                  {g.cover_url ? <img src={g.cover_url} alt="" width={36} height={50} style={{ borderRadius: 6 }} /> : <span style={{ width: 36, height: 50, borderRadius: 6, background: "var(--cover)", flex: "none" }} />}
                  <span style={{ flex: 1 }}>
                    <strong>{g.title}</strong>
                    <span className="muted" style={{ display: "block", fontSize: ".85rem" }}>
                      {[g.developer, g.release_year].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="muted">{added ? t("common.added") : t("common.add")}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
