"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Empty from "@/components/Empty";
import { useI18n } from "@/components/I18nProvider";
import { api } from "@/lib/api";
import { signInUrl } from "@/lib/auth";
import { decideCallback } from "@/lib/flow";

// PC-owned landing point after Global Auth sign-in or provider linking. It never trusts anything in the
// URL as identity: it asks the PC backend who the session belongs to (the backend checks Auth /auth/me),
// then applies PC-owned rules: consent, onboarding, and the validated destination (default /discover).
function Callback() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const next = params?.get("next");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        const onboarding = me.authenticated && !me.consent_required ? await api.onboardingStatus() : null;
        if (cancelled) return;
        const r = decideCallback(me, onboarding, next);
        if (r.kind === "failed") { setFailed(true); return; }
        // PC-owned: ask the backend to queue the Steam library sync if its own sync state says it is needed.
        // Fire and forget; a failure here must never block sign-in.
        api.syncIfNeeded().catch(() => {});
        router.replace(r.to);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, [next, router]);

  if (failed) {
    return (
      <main className="container" style={{ paddingTop: 64 }}>
        <Empty icon="warn" asPage title={t("callback.failedTitle")} text={t("callback.failedText")}>
          <a className="btn" href={signInUrl(next)}>{t("auth.continue")}</a>
        </Empty>
      </main>
    );
  }
  return <main className="container"><p className="muted" role="status">{t("callback.signingIn")}</p></main>;
}

export default function CallbackPage() {
  return <Suspense fallback={null}><Callback /></Suspense>;
}
