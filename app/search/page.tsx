"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import Empty from "@/components/Empty";
import Icon from "@/components/Icon";
import SkeletonRows from "@/components/Skeleton";
import { useI18n } from "@/components/I18nProvider";
import { api } from "@/lib/api";
import {
  LIBRARY_MODES, PAGE_SIZE, SLIDER_STEPS, SORT_MODES, activeFilterCount, clearFilters, parseQuery, stepToToman, toApiParams,
  toSearchString, toggleGenre, tomanToStep, type DiscoverQuery,
} from "@/lib/discover";
import { DEFAULT_BUDGET_MAX_TOMAN } from "@/lib/feed";
import type { DiscoverItem } from "@/lib/types";

// Search and Discover. The URL holds the whole state (?q=&genres=&min=&max=&library=&sort=), so a search can be
// shared and the back button works. Filters: genre (any of), price range in Toman for the person's region,
// library (not owned / owned / all). The person's budget ceiling is NOT applied: this is a search they typed.
export default function SearchPage() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}

function Inner() {
  const { t, num, toman, genre } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  // The query is React state first (controls respond instantly) and is mirrored into the URL;
  // when the URL changes from outside (Back, the header search) the state follows it.
  const [query, setQuery] = useState<DiscoverQuery>(() => parseQuery(sp));
  const [genreList, setGenreList] = useState<string[] | null>(null);
  const [items, setItems] = useState<DiscoverItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [maxToman, setMaxToman] = useState(DEFAULT_BUDGET_MAX_TOMAN);
  const [failed, setFailed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [panel, setPanel] = useState(false); // phone: filters panel open
  const [text, setText] = useState(query.q);
  const latest = useRef(0);

  const apply = useCallback((q: DiscoverQuery) => {
    setQuery(q);
    const s = toSearchString(q);
    router.replace(s ? `/search?${s}` : "/search", { scroll: false });
  }, [router]);

  const urlKey = sp.toString();
  useEffect(() => {
    const fromUrl = parseQuery(sp);
    setQuery((cur) => (toSearchString(cur) === toSearchString(fromUrl) ? cur : fromUrl));
  }, [urlKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { api.genres().then((r) => setGenreList(r.genres)).catch(() => setGenreList([])); }, []);
  useEffect(() => { setText(query.q); }, [query.q]);

  // typing updates the URL after a short pause
  useEffect(() => {
    if (text.trim() === query.q) return;
    const timer = setTimeout(() => apply({ ...query, q: text.trim() }), 300);
    return () => clearTimeout(timer);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const key = toSearchString(query);
  useEffect(() => {
    const ticket = ++latest.current;
    setFailed(false);
    api.discover(toApiParams(query, PAGE_SIZE, 0))
      .then((r) => {
        if (ticket !== latest.current) return;
        setItems(r.items); setTotal(r.total);
        if (r.max_price_toman) setMaxToman(r.max_price_toman);
      })
      .catch(() => { if (ticket === latest.current) { setFailed(true); setItems([]); } });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  async function more() {
    if (!items) return;
    setLoadingMore(true);
    try {
      const r = await api.discover(toApiParams(query, PAGE_SIZE, items.length));
      setItems((cur) => [...(cur ?? []), ...r.items]);
      setTotal(r.total);
    } catch { setFailed(true); } finally { setLoadingMore(false); }
  }

  const count = activeFilterCount(query);
  const minStep = tomanToStep(query.minPrice, maxToman);
  const maxStep = query.maxPrice === null ? SLIDER_STEPS : tomanToStep(query.maxPrice, maxToman);
  const setMin = (step: number) => { const s = Math.min(step, maxStep); apply({ ...query, minPrice: stepToToman(s, maxToman) }); };
  const setMax = (step: number) => { const s = Math.max(step, minStep); apply({ ...query, maxPrice: s >= SLIDER_STEPS ? null : stepToToman(s, maxToman) }); };
  const countText = total === 1 ? t("find.countOne") : t("find.count", { n: num(total) });

  const filters = (
    <aside className="fpanel" aria-label={t("find.filters")}>
      <section>
        <h2 className="fh">{t("find.genre")}</h2>
        {genreList && genreList.length === 0 && <p className="muted">{t("find.noGenres")}</p>}
        {(genreList ?? []).map((g) => {
          const on = query.genres.some((x) => x.toLowerCase() === g.toLowerCase());
          return (
            <label key={g} className="opt"><input type="checkbox" checked={on} onChange={() => apply(toggleGenre(query, g))} /><span dir="auto">{genre(g)}</span></label>
          );
        })}
      </section>
      <section>
        <h2 className="fh">{t("find.price")}</h2>
        <label className="range"><span className="muted">{t("find.priceMin")}</span>
          <input type="range" min={0} max={SLIDER_STEPS} value={minStep} onChange={(e) => setMin(Number(e.target.value))} aria-label={t("find.priceMin")} />
        </label>
        <label className="range"><span className="muted">{t("find.priceMax")}</span>
          <input type="range" min={0} max={SLIDER_STEPS} value={maxStep} onChange={(e) => setMax(Number(e.target.value))} aria-label={t("find.priceMax")} />
        </label>
        <div className="muted range-val">
          <span>{toman(query.minPrice)}</span>
          <span>{query.maxPrice === null ? t("find.noLimit") : toman(query.maxPrice)}</span>
        </div>
      </section>
      <section>
        <h2 className="fh">{t("find.library")}</h2>
        {LIBRARY_MODES.map((m) => (
          <label key={m} className="opt"><input type="radio" name="library" checked={query.library === m} onChange={() => apply({ ...query, library: m })} /><span>{t(`find.lib.${m}`)}</span></label>
        ))}
      </section>
      <button className="btn secondary" onClick={() => apply(clearFilters(query))} disabled={count === 0}>{t("find.clear")}</button>
    </aside>
  );

  return (
    <AppShell>
      <main className="container" style={{ paddingBottom: 64 }}>
        <h1 className="page-title" style={{ fontSize: "2rem", margin: "28px 0 16px" }}>{t("find.title")}</h1>
        <div className="find-top">
          <div className="hsearch big">
            <Icon name="search" />
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t("find.placeholder")} aria-label={t("find.label")} autoComplete="off" />
          </div>
          <button className="btn secondary find-toggle" aria-expanded={panel} onClick={() => setPanel((p) => !p)}>
            <Icon name="filters" /> {t("find.filters")}{count > 0 ? ` · ${num(count)}` : ""}
          </button>
        </div>
        {query.genres.length > 0 && (
          <div className="find-chips">
            {query.genres.map((g) => (
              <button key={g} className="chip" aria-label={t("find.remove", { name: genre(g) })} onClick={() => apply(toggleGenre(query, g))}>{genre(g)} <Icon name="x" /></button>
            ))}
          </div>
        )}
        <div className="find-layout">
          <div className={`find-filters${panel ? " open" : ""}`}>{filters}</div>
          <section className="find-main" aria-live="polite">
            <div className="find-bar">
              <span className="muted">{items === null ? " " : countText}</span>
              <label className="sortb"><span className="muted">{t("find.sort")}</span>
                <select value={query.sort} onChange={(e) => apply({ ...query, sort: e.target.value as DiscoverQuery["sort"] })} aria-label={t("find.sort")}>
                  {SORT_MODES.map((m) => <option key={m} value={m}>{t(`find.sort.${m}`)}</option>)}
                </select>
              </label>
            </div>
            {failed && <p className="error" role="alert">{t("find.unavailable")}</p>}
            {items === null && <SkeletonRows />}
            {items && items.length === 0 && !failed && (
              <Empty icon="search" title={t("find.noneTitle")} text={t("find.noneText")}>
                <button className="btn" onClick={() => apply(clearFilters(query))}>{t("find.clear")}</button>
              </Empty>
            )}
            {items && items.length > 0 && (
              <>
                <div className="find-grid">
                  {items.map((g) => (
                    <Link key={g.game_id} href={`/game/${g.game_id}`} className="gcard find-card">
                      <span className="gc-cover">
                        {g.cover_url ? <img src={g.cover_url} alt="" /> : <span className="gc-name" dir="auto" aria-hidden="true">{g.title}</span>}
                      </span>
                      <span className="gc-body">
                        <h3 dir="auto">{g.title}</h3>
                        <span className="muted find-sub" dir="auto">{[g.genres[0] ? genre(g.genres[0]) : null, g.developer].filter(Boolean).join(" · ")}</span>
                        <span className="price" style={{ fontSize: "1.05rem" }}>{toman(g.price_toman)}</span>
                        {g.owned && <span className="chip lib-chip">{t("find.owned")}</span>}
                      </span>
                    </Link>
                  ))}
                </div>
                {items.length < total && (
                  <div style={{ textAlign: "center", marginTop: 24 }}>
                    <button className="btn secondary" onClick={more} disabled={loadingMore}>{t("find.more")}</button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
