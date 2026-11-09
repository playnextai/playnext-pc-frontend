"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icon";
import Thumb from "@/components/Thumb";
import { useI18n } from "@/components/I18nProvider";
import { api, ApiError } from "@/lib/api";
import { steamSignInUrl } from "@/lib/auth";
import { DNA_DESC_KEYS, DNA_TYPE_KEYS } from "@/lib/i18n";
import type { GamerDna } from "@/lib/types";

type State = { kind: "loading" } | { kind: "ok"; dna: GamerDna } | { kind: "needs_steam" } | { kind: "error" };

// Gamer DNA: a light-hearted type plus plain stats from the Steam library. Email-only people get a
// gated "needs Steam" card (the backend answers 403 steam_required); a first sync still running shows a wait card.
export default function DnaPage() {
  const { t, hours, percent } = useI18n();
  const [st, setSt] = useState<State>({ kind: "loading" });

  useEffect(() => {
    api.gamerDna()
      .then((dna) => setSt({ kind: "ok", dna }))
      .catch((e) => setSt(e instanceof ApiError && e.status === 403 ? { kind: "needs_steam" } : { kind: "error" }));
  }, []);

  return (
    <AppShell>
      <main className="container" style={{ paddingBottom: 64, maxWidth: 680 }}>
        <h1 className="page-title" style={{ fontSize: "2rem", margin: "28px 0 4px" }}>{t("dna.title")}</h1>
        <p className="muted" style={{ margin: "0 0 20px" }}>{t("dna.sub")}</p>
        {st.kind === "loading" && <p className="muted">{t("common.loading")}</p>}
        {st.kind === "error" && <p className="error" role="alert">{t("common.refresh")}</p>}
        {st.kind === "needs_steam" && (
          <div className="card stack" style={{ alignItems: "center", textAlign: "center", padding: 28 }}>
            <span className="dna-ic"><Icon name="gamepad" /></span>
            <strong style={{ fontSize: "1.2rem" }}>{t("dna.needsSteamTitle")}</strong>
            <span className="muted">{t("dna.needsSteamText")}</span>
            <a className="btn" style={{ width: "100%" }} href={steamSignInUrl("/dna")}>{t("dna.needsSteamButton")}</a>
            <span className="muted" style={{ fontSize: ".85rem" }}>{t("dna.needsSteamNote")}</span>
          </div>
        )}
        {st.kind === "ok" && !st.dna.has_data && (
          <div className="card stack" style={{ alignItems: "center", textAlign: "center", padding: 28 }}>
            <span className="spinner" aria-hidden="true" />
            <strong style={{ fontSize: "1.2rem" }}>{t("dna.syncingTitle")}</strong>
            <span className="muted">{t("dna.syncingText")}</span>
          </div>
        )}
        {st.kind === "ok" && st.dna.has_data && <Stats dna={st.dna} hours={hours} percent={percent} />}
      </main>
    </AppShell>
  );
}

function Stats({ dna, hours, percent }: { dna: GamerDna; hours: (n: number) => string; percent: (n: number) => string }) {
  const { t, lang, genre } = useI18n();
  const nf = new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US");
  const tk = dna.type_label ? DNA_TYPE_KEYS[dna.type_label] ?? null : null;
  const dk = dna.type_label ? DNA_DESC_KEYS[dna.type_label] ?? null : null;
  const top = dna.top_genres.slice(0, 3);
  const maxH = Math.max(1, ...top.map((g) => g.hours));
  const tiles: [string, string][] = [
    [hours(Math.round(dna.total_hours)), t("dna.totalPlaytime")],
    [nf.format(dna.backlog_count), t("dna.backlog")],
    ...(dna.avg_achievement_completion !== null ? [[percent(Math.round(dna.avg_achievement_completion * 100)), t("dna.achievements")] as [string, string]] : []),
    ...(dna.most_played_studio ? [[dna.most_played_studio.name, t("dna.studio")] as [string, string]] : []),
  ];
  return (
    <div className="stack" style={{ gap: 20 }}>
      {dna.type_label && (
        <div className="card" style={{ textAlign: "center", padding: "30px 20px" }}>
          <div className="muted">{t("dna.yourType")}</div>
          <div style={{ fontSize: "1.9rem", fontWeight: 600, color: "var(--mint)", margin: "6px 0" }}>{tk ? t(tk) : dna.type_label}</div>
          {dk && <div className="muted">{t(dk)}</div>}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
        {tiles.map(([v, l]) => (
          <div key={l} className="card">
            <div className="price dna-val" dir="auto">{v}</div>
            <div className="muted" style={{ fontSize: ".9rem", overflowWrap: "anywhere" }}>{l}</div>
          </div>
        ))}
      </div>
      {top.length > 0 && (
        <section aria-label={t("dna.topGenres")} className="stack">
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>{t("dna.topGenres")}</h2>
          {top.map((g) => (
            <div key={g.genre}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>{genre(g.genre)}</span><span className="muted">{hours(Math.round(g.hours))}</span></div>
              <div style={{ height: 10, borderRadius: 6, background: "#1f1f1e", overflow: "hidden", marginTop: 4 }}>
                <div style={{ height: 10, width: `${Math.round((g.hours / maxH) * 100)}%`, background: "linear-gradient(90deg, #a8b0ee, #5ac8a0)" }} />
              </div>
            </div>
          ))}
        </section>
      )}
      {dna.most_played_game && (
        <div className="card" style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Thumb url={dna.most_played_game.cover_url} />
          <div><div className="muted" style={{ fontSize: ".85rem" }}>{t("dna.mostPlayed")}</div>
            <strong dir="auto">{dna.most_played_game.title}</strong> · {hours(Math.round(dna.most_played_game.hours))}</div>
        </div>
      )}
      <p className="muted" style={{ fontSize: ".85rem", lineHeight: 1.7 }}>{t("dna.typeNote")}</p>
    </div>
  );
}
