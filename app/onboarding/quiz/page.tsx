"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Gate from "@/components/Gate";
import Icon from "@/components/Icon";
import SkeletonRows from "@/components/Skeleton";
import { useI18n } from "@/components/I18nProvider";
import { api } from "@/lib/api";
import { counterKey, genreSpread, toggleSelection } from "@/lib/quiz";
import type { QuizOption } from "@/lib/types";

// Taste quiz (step 2 of 3): a 3x3 grid of well-known games, one per genre. Tap a few you've loved; a check
// badge marks each pick. No minimum, skip link at the top, live counter bar at the bottom.
export default function QuizStep() {
  const { t, genre, lang } = useI18n();
  const router = useRouter();
  const [options, setOptions] = useState<QuizOption[] | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.quizOptions().then((r) => setOptions(r.options)).catch(() => setError(t("quiz.loadFailed")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spread = useMemo(() => genreSpread(options ?? [], picked), [options, picked]);

  async function next(skip: boolean) {
    setBusy(true);
    setError(null);
    try {
      // Submitting (even empty) marks the step done on the backend; skipping marks it explicitly.
      const status = skip ? await api.completeStep("quiz") : (await api.submitQuiz([...picked]), await api.onboardingStatus());
      router.replace(status.next_route ?? "/discover");
    } catch {
      setError(t("common.saveFailed"));
      setBusy(false);
    }
  }

  return (
    <Gate>
      <main className="container" style={{ paddingTop: 28, paddingBottom: 112, maxWidth: 860 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }} className="muted">
          <span>{t("region.step", { n: 2 })}</span>
          <button disabled={busy} onClick={() => next(true)} className="link-btn">{t("quiz.skip")}</button>
        </div>
        <h1 style={{ textAlign: "center", fontWeight: 600, margin: "20px 0 8px" }}>{t("quiz.title")}</h1>
        <p className="muted" style={{ textAlign: "center", margin: "0 0 28px", lineHeight: 1.7 }}>{t("quiz.sub")}</p>

        {options === null && !error && <SkeletonRows n={6} grid />}
        <div className="quiz-grid" role="group" aria-label={t("quiz.grid")}>
          {options?.map((o) => {
            const on = picked.has(o.game_id);
            return (
              <button key={o.game_id} aria-pressed={on} onClick={() => setPicked((p) => toggleSelection(p, o.game_id))} className={`quiz-tile${on ? " on" : ""}`}>
                {on && <span className="quiz-check" aria-hidden="true"><Icon name="check" className="icon-sm" /></span>}
                <span className="quiz-name" dir="auto">{o.title}</span>
                <span className="quiz-genre">{o.genres.slice(0, 2).map(genre).join(" · ")}</span>
              </button>
            );
          })}
        </div>
        {error && <p className="error" role="alert">{error}</p>}

        <div className="quiz-bar">
          <span aria-live="polite" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {picked.size > 0 && <span style={{ color: "var(--mint)", display: "inline-flex" }}><Icon name="check" /></span>}
            {t(counterKey(picked.size, spread), { n: picked.size })}
          </span>
          <button className="btn" disabled={busy} onClick={() => next(false)}>{t("quiz.go")}</button>
        </div>
      </main>
    </Gate>
  );
}
