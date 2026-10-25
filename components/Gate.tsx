"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { signInUrl } from "@/lib/auth";
import { decideGate, isOnboardingPath } from "@/lib/flow";

/**
 * Wrap every signed-in page. On load it asks the backend who you are and
 * whether onboarding is finished, then:
 *   signed out        -> auth.playnextai.com (we never show a sign-in form here)
 *   consent required  -> /consent
 *   onboarding open   -> the next onboarding step (unless you're already on one)
 *   otherwise         -> renders the page
 */
export default function Gate({ children, allowIncompleteOnboarding = false }: {
  children: React.ReactNode;
  allowIncompleteOnboarding?: boolean;
}) {
  const router = useRouter();
  const path = usePathname() ?? "/";
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        const onboarding = me.authenticated && !me.consent_required ? await api.onboardingStatus() : null;
        if (cancelled) return;
        const gate = decideGate(me, onboarding);
        if (gate.kind === "sign_in") {
          window.location.assign(signInUrl(path + window.location.search));
        } else if (gate.kind === "consent" && path !== "/consent") {
          router.replace("/consent");
        } else if (gate.kind === "onboarding" && !(allowIncompleteOnboarding || isOnboardingPath(path))) {
          router.replace(gate.route);
        } else {
          setReady(true);
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.isUnauthenticated) {
          window.location.assign(signInUrl(path + window.location.search));
        } else if (e instanceof ApiError && e.isRateLimited) {
          setError(`Too many requests. Try again in ${e.retryAfterSec ?? 60} seconds.`);
        } else {
          setError("Something went wrong. Please refresh the page.");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [path, router, allowIncompleteOnboarding]);

  if (error) return <main className="container"><p className="error">{error}</p></main>;
  if (!ready) return <main className="container"><p className="muted">Loading…</p></main>;
  return <>{children}</>;
}
