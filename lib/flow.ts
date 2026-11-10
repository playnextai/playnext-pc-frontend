import { safeDestination } from "./auth.ts";
import type { Me, OnboardingStatus } from "./types.ts";

export type Gate =
  | { kind: "sign_in" }
  | { kind: "consent" }
  | { kind: "onboarding"; route: string }
  | { kind: "ok" };

/** Pure routing decision, evaluated on app load and after every sign-in return.
 *  Order matters: sign-in, then consent (policy/age), then onboarding. */
export function decideGate(me: Me, onboarding: OnboardingStatus | null): Gate {
  if (!me.authenticated) return { kind: "sign_in" };
  if (me.consent_required) return { kind: "consent" };
  if (onboarding && !onboarding.complete && onboarding.next_route) {
    return { kind: "onboarding", route: onboarding.next_route };
  }
  return { kind: "ok" };
}

/** Paths a not-yet-onboarded person may visit without being bounced. */
export function isOnboardingPath(path: string): boolean {
  return path === "/onboarding" || path.startsWith("/onboarding/");
}

export type CallbackResult =
  | { kind: "failed" }
  | { kind: "go"; to: string };

/** What the /auth/sso/callback page does once the backend has validated the session with Auth.
 *  Not signed in -> failed (show a retry, never auto-redirect: that could loop). Consent, then PC
 *  onboarding, then the requested destination (validated; /discover by default). */
export function decideCallback(me: Me, onboarding: OnboardingStatus | null, next: string | null | undefined): CallbackResult {
  if (!me.authenticated) return { kind: "failed" };
  if (me.consent_required) return { kind: "go", to: "/consent" };
  if (onboarding && !onboarding.complete && onboarding.next_route) return { kind: "go", to: onboarding.next_route };
  return { kind: "go", to: safeDestination(next) };
}
