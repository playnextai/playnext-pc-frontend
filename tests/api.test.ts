import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { api, ApiError, setFetch } from "../lib/api.ts";

type Call = { url: string; init: RequestInit };
function fake(status: number, body: unknown, calls: Call[] = []) {
  setFetch((async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(body === null ? "" : JSON.stringify(body), { status });
  }) as unknown as typeof fetch);
  return calls;
}
afterEach(() => setFetch(undefined));

test("requests go to same-origin /api with credentials and JSON bodies", async () => {
  const calls = fake(200, { status: "added" });
  await api.addToCart(7);
  assert.equal(calls[0].url, "/api/cart/add");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.credentials, "include");
  assert.equal(calls[0].init.body, JSON.stringify({ game_edition_id: 7 }));
});

test("query strings are encoded", async () => {
  const calls = fake(200, { results: [] });
  await api.searchGames("a&b c");
  assert.equal(calls[0].url, "/api/games/search?q=a%26b%20c");
});

test("401 -> ApiError.isUnauthenticated", async () => {
  fake(401, { detail: "unauthenticated" });
  await assert.rejects(api.cart(), (e: unknown) => e instanceof ApiError && e.isUnauthenticated && e.code === "unauthenticated");
});

test("429 exposes retry_after_sec", async () => {
  fake(429, { error: "rate_limited", retry_after_sec: 120 });
  await assert.rejects(api.me(), (e: unknown) => e instanceof ApiError && e.isRateLimited && e.retryAfterSec === 120 && e.code === "rate_limited");
});

test("validation errors surface the backend's detail code", async () => {
  fake(400, { detail: "region_required" });
  await assert.rejects(api.addToCart(1), (e: unknown) => e instanceof ApiError && e.code === "region_required");
});

test("empty body responses do not throw", async () => {
  fake(200, null);
  assert.equal(await api.logout(), null);
});

test("PATCH settings sends only provided fields", async () => {
  const calls = fake(200, {});
  await api.updateSettings({ region: "TR" });
  assert.equal(calls[0].init.method, "PATCH");
  assert.equal(calls[0].init.body, JSON.stringify({ region: "TR" }));
});
