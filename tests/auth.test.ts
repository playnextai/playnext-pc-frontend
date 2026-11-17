import test from "node:test";
import assert from "node:assert/strict";
import { accountUrl, callbackUrl, googleLinkUrl, isSafeReturnPath, logoutUrl, safeDestination, signInUrl, steamLinkUrl } from "../lib/auth.ts";
import { decideCallback } from "../lib/flow.ts";

const o = { authUrl: "https://auth.playnext.ir", siteUrl: "https://pc.playnext.ir" };

const CB = "https%3A%2F%2Fpc.playnext.ir%2Fauth%2Fsso%2Fcallback";

test("sign-in is exactly the central login with the encoded PC callback", () => {
  assert.equal(signInUrl(undefined, o), `https://auth.playnext.ir/login?return_url=${CB}`);
  assert.equal(signInUrl("/discover", o), `https://auth.playnext.ir/login?return_url=${CB}`);
});

test("a deep link rides on the callback as an encoded next", () => {
  const u = new URL(signInUrl("/game/42?x=1", o));
  const cb = new URL(u.searchParams.get("return_url")!);
  assert.equal(cb.origin + cb.pathname, "https://pc.playnext.ir/auth/sso/callback");
  assert.equal(cb.searchParams.get("next"), "/game/42?x=1");
});

test("provider links go to the Auth-owned link routes with the callback", () => {
  assert.equal(steamLinkUrl(undefined, o), `https://auth.playnext.ir/auth/steam/link?return_url=${CB}`);
  assert.equal(googleLinkUrl(undefined, o), `https://auth.playnext.ir/auth/google/link?return_url=${CB}`);
  const u = new URL(steamLinkUrl("/settings", o));
  assert.equal(new URL(u.searchParams.get("return_url")!).searchParams.get("next"), "/settings");
});

test("account and logout point at the Auth host", () => {
  assert.equal(accountUrl(o), "https://auth.playnext.ir/");
  assert.equal(logoutUrl(o), "https://auth.playnext.ir/auth/logout");
});

test("unsafe destinations fall back to /discover", () => {
  for (const bad of ["//evil.com", "https://evil.com", "javascript:alert(1)", "\\evil.com", "/\\evil.com",
    "", null, undefined, "evil", "/a\nb", "/auth/sso/callback", "/auth/sso/callback?next=/x"]) {
    assert.equal(safeDestination(bad as string), "/discover", String(bad));
  }
  assert.equal(isSafeReturnPath("//evil.com"), false);
});

test("no way to make the return_url point at another host", () => {
  for (const f of [signInUrl, steamLinkUrl, googleLinkUrl]) {
    const u = new URL(f("//evil.com/x", o));
    assert.equal(new URL(u.searchParams.get("return_url")!).host, "pc.playnext.ir");
  }
});

test("safe paths survive, trailing slash on site url handled", () => {
  assert.equal(callbackUrl("/library", "https://pc.playnext.ir/"), "https://pc.playnext.ir/auth/sso/callback?next=%2Flibrary");
});

const authed = { authenticated: true, user: { id: 7, display_name: "A" }, consent_required: false } as never;
const done = { complete: true, next_step: null, next_route: null, steps: { region: true, quiz: true, library: true } } as never;
const open = { complete: false, next_step: "quiz", next_route: "/onboarding/quiz", steps: { region: true, quiz: false, library: false } } as never;

test("callback decisions: failed, consent, onboarding, destination", () => {
  assert.deepEqual(decideCallback({ authenticated: false } as never, null, "/library"), { kind: "failed" });
  assert.deepEqual(decideCallback({ ...(authed as object), consent_required: true } as never, null, "/library"), { kind: "go", to: "/consent" });
  assert.deepEqual(decideCallback(authed, open, "/library"), { kind: "go", to: "/onboarding/quiz" });
  assert.deepEqual(decideCallback(authed, done, "/library"), { kind: "go", to: "/library" });
  assert.deepEqual(decideCallback(authed, done, null), { kind: "go", to: "/discover" });
  assert.deepEqual(decideCallback(authed, done, "https://evil.example"), { kind: "go", to: "/discover" });
});
