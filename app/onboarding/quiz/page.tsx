"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Gate from "@/components/Gate";
import { api } from "@/lib/api";
import { counterLabel, toggleSelection } from "@/lib/quiz";
import type { QuizOption } from "@/lib/types";

// Taste quiz: tappable genre-diverse grid, live counter, no minimum, skip link.
export default function QuizStep() {
  const router = useRouter();
  const [options, setOptions] = useState<QuizOption[] | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.quizOptions().then((r) => setOptions(r.options)).catch(() => setError("Could not load the quiz."));
  }, []);

  async function next(skip: boolean) {
    setBusy(true);
    setError(null);
    try {
      // Submitting (even empty) marks the step done on the backend; skipping marks it explicitly.
      const status = skip ? await api.completeStep("quiz") : (await api.submitQuiz([...picked]), await api.onboardingStatus());
      router.replace(status.next_route ?? "/discover");
    } catch {
      setError("Could not save. Try again.");
      setBusy(false);
    }
  }

  return (
    <Gate>
      <main className="container" style={{ paddingTop: 32, paddingBottom: 96 }}>
        <h1>What do you like?</h1>
        <p className="muted">Pick any games that feel like you. There's no minimum.</p>
        {options === null && !error && <p className="muted">Loading…</p>}
        <div className="grid">
          {options?.map((o) => {
            const on = picked.has(o.game_id);
            return (
              <button key={o.game_id} aria-pressed={on} onClick={() => setPicked((p) => toggleSelection(p, o.game_id))}
                className="card" style={{ textAlign: "start", cursor: "pointer", color: "inherit", outline: on ? "2px solid var(--cyan)" : "none" }}>
                {o.cover_url && <img src={o.cover_url} alt="" style={{ width: "100%", borderRadius: 10 }} />}
                <strong style={{ display: "block", marginTop: 8 }}>{o.title}</strong>
                <span className="muted" style={{ fontSize: ".8rem" }}>{o.genres.slice(0, 2).join(" · ")}</span>
              </button>
            );
          })}
        </div>
        {error && <p className="error">{error}</p>}
        <div className="card" style={{ position: "fixed", insetInline: 0, bottom: 0, display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", borderRadius: 0 }}>
          <span aria-live="polite">{counterLabel(picked.size)}</span>
          <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button className="btn secondary" disabled={busy} onClick={() => next(true)}>Skip</button>
            <button className="btn" disabled={busy} onClick={() => next(false)}>Let's go</button>
          </span>
        </div>
      </main>
    </Gate>
  );
}
