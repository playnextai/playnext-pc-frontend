"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Gate from "@/components/Gate";
import { api, ApiError } from "@/lib/api";

// Shown when /auth/me says consent_required (policy version bumped or minimum age raised).
export default function ConsentPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      await api.acceptConsent();
      router.replace("/discover");
    } catch (e) {
      setError(e instanceof ApiError && e.isRateLimited ? "Please wait a moment and try again." : "Could not save. Try again.");
      setBusy(false);
    }
  }

  return (
    <Gate allowIncompleteOnboarding>
      <main className="container" style={{ maxWidth: 520, paddingTop: 64 }}>
        <div className="card">
          <h1 style={{ marginTop: 0 }}>One quick thing</h1>
          <p className="muted">Our privacy policy has been updated.</p>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <input type="checkbox" style={{ width: "auto", marginTop: 4 }} checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            <span>I am at least 16 years old and I accept the Privacy Policy.</span>
          </label>
          {error && <p className="error">{error}</p>}
          <p><button className="btn" disabled={!checked || busy} onClick={accept}>Continue</button></p>
        </div>
      </main>
    </Gate>
  );
}
