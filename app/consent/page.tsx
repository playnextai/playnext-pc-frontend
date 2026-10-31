"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Gate from "@/components/Gate";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/components/I18nProvider";

// Shown when /auth/me says consent_required (policy version bumped or minimum age raised).
export default function ConsentPage() {
  const { t } = useI18n();
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
      setError(e instanceof ApiError && e.isRateLimited ? t("consent.rateLimited") : t("consent.failed"));
      setBusy(false);
    }
  }

  return (
    <Gate allowIncompleteOnboarding>
      <main className="container" style={{ maxWidth: 520, paddingTop: 64 }}>
        <div className="card">
          <h1 style={{ marginTop: 0 }}>{t("consent.title")}</h1>
          <p className="muted">{t("consent.sub")}</p>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <input type="checkbox" style={{ width: "auto", marginTop: 4, accentColor: "var(--mint)" }} checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            <span>{t("consent.check")}</span>
          </label>
          {error && <p className="error">{error}</p>}
          <p><button className="btn" disabled={!checked || busy} onClick={accept}>{t("common.continue")}</button></p>
        </div>
      </main>
    </Gate>
  );
}
