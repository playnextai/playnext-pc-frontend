"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Gate from "@/components/Gate";
import { api, ApiError } from "@/lib/api";
import type { Region, SettingsView } from "@/lib/types";

// Required onboarding step: without a pricing region the whole app has no prices.
// The same choice can be changed later in /settings.
export default function RegionStep() {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsView | null>(null);
  const [region, setRegion] = useState<Region | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.settings().then((s) => { setSettings(s); if (s.region) setRegion(s.region); }).catch(() => setError("Could not load options."));
  }, []);

  async function save() {
    if (!region) return;
    setBusy(true);
    setError(null);
    try {
      await api.updateSettings({ region });
      const status = await api.onboardingStatus();
      router.replace(status.next_route ?? "/discover");
    } catch (e) {
      setError(e instanceof ApiError && e.code === "invalid_region" ? "Pick one of the listed regions." : "Could not save. Try again.");
      setBusy(false);
    }
  }

  return (
    <Gate>
      <main className="container" style={{ maxWidth: 520, paddingTop: 64 }}>
        <div className="card">
          <h1 style={{ marginTop: 0 }}>Where should prices come from?</h1>
          <p className="muted">
            Steam has no store for Iran, so pick the region whose prices you want to see. We show them in Toman.
            You can change this any time in Settings.
          </p>
          <select value={region} onChange={(e) => setRegion(e.target.value as Region)} aria-label="Pricing region">
            <option value="" disabled>Choose a region…</option>
            {settings?.region_options.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
          </select>
          {error && <p className="error">{error}</p>}
          <p><button className="btn" disabled={!region || busy} onClick={save}>Continue</button></p>
        </div>
      </main>
    </Gate>
  );
}
