import test from "node:test";
import assert from "node:assert/strict";
import { shouldSearch, normalizeQuery } from "../lib/search.ts";
import { genreSpread, counterKey, toggleSelection } from "../lib/quiz.ts";
import { dismiss, isDismissed } from "../lib/dismiss.ts";
import { CARD_ACTIONS, REMOVES_CARD, feedbackFor } from "../lib/cards.ts";

test("search only fires for 2+ real characters", () => {
  assert.equal(shouldSearch(""), false);
  assert.equal(shouldSearch(" a "), false);
  assert.equal(shouldSearch("ha"), true);
  assert.equal(normalizeQuery("  hades "), "hades");
});

test("quiz selection toggles without mutating the old set", () => {
  const a = new Set([1]);
  const b = toggleSelection(a, 2);
  assert.deepEqual([...a], [1]);
  assert.deepEqual([...b].sort(), [1, 2]);
  assert.deepEqual([...toggleSelection(b, 1)], [2]);
});

test("counter label has no minimum, pluralizes, and only says 'nice spread' when it is true", () => {
  assert.equal(counterKey(0), "quiz.none");
  assert.equal(counterKey(1), "quiz.one");
  assert.equal(counterKey(5), "quiz.many");
  assert.equal(counterKey(3, 3), "quiz.spread");
  assert.equal(counterKey(5, 2), "quiz.many");
  assert.equal(counterKey(2, 2), "quiz.many");
});

test("dismissal persists, and broken storage never throws", () => {
  const mem = new Map<string, string>();
  const store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
  assert.equal(isDismissed("steam-banner", store), false);
  dismiss("steam-banner", store);
  assert.equal(isDismissed("steam-banner", store), true);
  const broken = { getItem: () => { throw new Error("x"); }, setItem: () => { throw new Error("x"); } };
  assert.equal(isDismissed("a", broken), false);
  assert.doesNotThrow(() => dismiss("a", broken));
  assert.equal(isDismissed("a", null), false);
});

test("card has exactly the four designed actions; dislike is not one of them", () => {
  assert.deepEqual(CARD_ACTIONS.map((a) => a.action), ["like", "not_interested", "already_own", "wishlist"]);
  assert.equal(feedbackFor("like"), "liked");
  assert.equal(feedbackFor("wishlist"), null);
  assert.ok(REMOVES_CARD.has("not_interested") && REMOVES_CARD.has("already_own") && !REMOVES_CARD.has("like"));
});

test("genre spread counts distinct first genres among the picks only", () => {
  const opts = [
    { game_id: 1, genres: ["RPG", "Action"] }, { game_id: 2, genres: ["RPG"] },
    { game_id: 3, genres: ["Strategy"] }, { game_id: 4, genres: [] }, { game_id: 5, genres: ["Horror"] },
  ];
  assert.equal(genreSpread(opts, new Set([1, 2, 3, 4])), 2);
  assert.equal(genreSpread(opts, new Set([1, 3, 5])), 3);
  assert.equal(genreSpread(opts, new Set()), 0);
});
