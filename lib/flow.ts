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
