import test from "node:test";
import assert from "node:assert/strict";
import { dedupeRows, isColdStart, shouldPollSync, syncBanner, type FeedRowData } from "../lib/feed.ts";
import type { GameCard } from "../lib/types.ts";

const card = (id: number): GameCard => ({ game_id: id, title: `g${id}`, cover_url: null, price_native: null, price_currency: null, price_toman: null, discount_pct: null });
const row = (id: string, ...ids: number[]): FeedRowData => ({ id, title: id, cards: ids.map(card) });

test("a game shows once; earlier rows win; empty rows dropped; input untouched", () => {
  const input = [row("a", 1, 2), row("b", 2, 3), row("c", 1, 2)];
  const out = dedupeRows(input);
  assert.deepEqual(out.map((r) => [r.id, r.cards.map((c) => c.game_id)]), [["a", [1, 2]], ["b", [3]]]);
  assert.equal(input[1].cards.length, 2);
});

test("cold start only when every personal row is empty", () => {
  assert.equal(isColdStart([]), true);
  assert.equal(isColdStart([row("a"), row("b")]), true);
  assert.equal(isColdStart([row("a"), row("b", 1)]), false);
});

test("sync banner shows for in-progress and failed only", () => {
  assert.deepEqual(syncBanner("running"), { show: true, tone: "progress", text: syncBanner("queued") && (syncBanner("running") as { text: string }).text });
  assert.equal(syncBanner("queued").show, true);
  const failed = syncBanner("failed");
  assert.ok(failed.show && failed.tone === "problem");
  for (const s of ["done", "never", "not_applicable", null] as const) assert.equal(syncBanner(s).show, false);
});

test("polling only while queued or running", () => {
  assert.equal(shouldPollSync("queued"), true);
  assert.equal(shouldPollSync("running"), true);
  for (const s of ["done", "failed", "never", "not_applicable", null] as const) assert.equal(shouldPollSync(s), false);
});
