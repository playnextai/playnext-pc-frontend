import test from "node:test";
import assert from "node:assert/strict";
import { buildReturnUrl, isSafeReturnPath, signInUrl, steamSignInUrl } from "../lib/auth.ts";

const o = { authUrl: "https://auth.playnextai.com", siteUrl: "https://pc.playnextai.com" };

test("sign-in always goes to the auth site with an encoded absolute return_url", () => {
  const u = new URL(signInUrl("/game/42?x=1", o));
  assert.equal(u.origin, "https://auth.playnextai.com");
  assert.equal(u.pathname, "/login");
  assert.equal(u.searchParams.get("return_url"), "https://pc.playnextai.com/game/42?x=1");
});

test("steam sign-in also goes to the auth site", () => {
  const u = new URL(steamSignInUrl("/discover", o));
  assert.equal(u.origin, "https://auth.playnextai.com");
  assert.equal(u.pathname, "/steam/login");
});

test("unsafe return paths fall back to /discover", () => {
  for (const bad of ["//evil.com", "https://evil.com", "javascript:alert(1)", "\\evil.com", "/\\evil.com",
    "", null, undefined, "evil", "/a\nb"]) {
    assert.equal(isSafeReturnPath(bad as string), false, String(bad));
    assert.equal(buildReturnUrl(bad as string, "https://pc.playnextai.com"), "https://pc.playnextai.com/discover");
  }
});

test("safe paths survive, trailing slash on site url handled", () => {
  assert.equal(buildReturnUrl("/library", "https://pc.playnextai.com/"), "https://pc.playnextai.com/library");
});

test("no way to make the return_url point at another host", () => {
  const u = new URL(signInUrl("//evil.com/x", o));
  assert.equal(new URL(u.searchParams.get("return_url")!).host, "pc.playnextai.com");
});
