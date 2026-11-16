"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { useI18n } from "@/components/I18nProvider";
import { api } from "@/lib/api";
import { DEFAULT_QUERY, DROPDOWN_SIZE, toApiParams, toSearchString } from "@/lib/discover";
import { normalizeQuery, shouldSearch } from "@/lib/search";
import type { DiscoverItem } from "@/lib/types";

/** The header search box: type, see the best few matches with their Toman price, Enter (or the last
 *  row) opens the full Search and Discover page. It searches the whole catalog, including games already owned. */
export default function HeaderSearch() {
  const { t, toman } = useI18n();
  const router = useRouter();
  const onSearchPage = usePathname() === "/search"; // the page has its own, bigger search box
  const [q, setQ] = useState("");
  const [items, setItems] = useState<DiscoverItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [hl, setHl] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const latest = useRef(0); // ignore responses from older keystrokes
  const hlTouched = useRef(false); // Enter opens the highlighted game only after the arrow keys were used

  useEffect(() => {
    if (!shouldSearch(q)) { setItems(null); setFailed(false); return; }
    const ticket = ++latest.current;
    const timer = setTimeout(() => {
      api.discover(toApiParams({ ...DEFAULT_QUERY, q: normalizeQuery(q), library: "all" }, DROPDOWN_SIZE, 0))
        .then((r) => { if (ticket === latest.current) { setItems(r.items); setFailed(false); setHl(0); } })
        .catch(() => { if (ticket === latest.current) setFailed(true); });
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  const allHref = `/search?${toSearchString({ ...DEFAULT_QUERY, q: normalizeQuery(q), library: "all" })}`;
  const go = (href: string) => { setOpen(false); router.push(href); };

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setOpen(false); return; }
    const n = items?.length ?? 0;
    if (e.key === "ArrowDown" && n) { e.preventDefault(); setHl((h) => (h + 1) % n); }
    if (e.key === "ArrowUp" && n) { e.preventDefault(); setHl((h) => (h - 1 + n) % n); }
    if (e.key === "Enter" && shouldSearch(q)) {
      e.preventDefault();
      go(items && items[hl] && hlTouched.current ? `/game/${items[hl].game_id}` : allHref);
    }
  }

  if (onSearchPage) return null;
  const showPanel = open && shouldSearch(q);
  return (
    <div className="hsearch" ref={box} role="search">
      <Icon name="search" />
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); hlTouched.current = false; }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === "ArrowDown" || e.key === "ArrowUp") hlTouched.current = true; onKey(e); }}
        placeholder={t("find.placeholder")}
        aria-label={t("find.label")}
        aria-expanded={showPanel}
        aria-controls="hsearch-list"
        autoComplete="off"
      />
      {showPanel && (
        <div className="hs-drop" id="hsearch-list" role="listbox">
          {failed && <p className="hs-note error">{t("find.unavailable")}</p>}
          {!failed && items && items.length === 0 && <p className="hs-note muted">{t("find.none", { q: normalizeQuery(q) })}</p>}
          {!failed && items?.map((g, i) => (
            <Link key={g.game_id} href={`/game/${g.game_id}`} role="option" aria-selected={i === hl} className={`hs-row${i === hl ? " hl" : ""}`} onClick={() => setOpen(false)}>
              {g.cover_url ? <img src={g.cover_url} alt="" width={34} height={44} /> : <span className="hs-thumb" />}
              <span className="hs-info">
                <strong dir="auto">{g.title}</strong>
                <span className="muted" dir="auto">{[g.genres[0], g.developer].filter(Boolean).join(" · ")}</span>
              </span>
              <span className="price hs-price">{toman(g.price_toman)}</span>
            </Link>
          ))}
          {!failed && items && items.length > 0 && (
            <Link href={allHref} className="hs-all" onClick={() => setOpen(false)}>{t("find.seeAll", { q: normalizeQuery(q) })}</Link>
          )}
        </div>
      )}
    </div>
  );
}
