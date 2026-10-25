import test from "node:test";
import assert from "node:assert/strict";
import { decideGate, isOnboardingPath } from "../lib/flow.ts";
import type { OnboardingStatus } from "../lib/types.ts";

const done: OnboardingStatus = { complete: true, next_step: null, next_route: null, steps: { region: true, quiz: true, library: true } };
const atQuiz: OnboardingStatus = { complete: false, next_step: "quiz", next_route: "/onboarding/quiz", steps: { region: true, quiz: false, library: false } };

test("signed out -> sign in, before anything else", () => {
  assert.deepEqual(decideGate({ authenticated: false }, null), { kind: "sign_in" });
});
test("consent comes before onboarding", () => {
  assert.deepEqual(decideGate({ authenticated: true, consent_required: true }, atQuiz), { kind: "consent" });
});
test("incomplete onboarding sends to the next step's route", () => {
  assert.deepEqual(decideGate({ authenticated: true, consent_required: false }, atQuiz), { kind: "onboarding", route: "/onboarding/quiz" });
});
test("complete onboarding -> ok", () => {
  assert.deepEqual(decideGate({ authenticated: true, consent_required: false }, done), { kind: "ok" });
});
test("onboarding path detection", () => {
  assert.equal(isOnboardingPath("/onboarding/region"), true);
  assert.equal(isOnboardingPath("/onboardingx"), false);
  assert.equal(isOnboardingPath("/discover"), false);
});
