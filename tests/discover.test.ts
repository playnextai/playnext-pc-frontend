import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_QUERY, activeFilterCount, clearFilters, parseQuery, stepToToman, toApiParams, toSearchString, toggleGenre, tomanToStep, SLIDER_STEPS,
} from "../lib/discover.ts";

const sp = (s: string) => new URLSearchParams(s);

test("defaults produce an empty URL and round-trip", () => {
  assert.equal(toSearchString(DEFAULT_QUERY), "");
  assert.deepEqual(parseQuery(sp("")), DEFAULT_QUERY);
  const q = { q: "hades ii", genres: ["RPG", "Indie"], minPrice: 100000, maxPrice: 900000, library: "all" as const, sort: "price_asc" as const };
  assert.deepEqual(parseQuery(sp(toSearchString(q))), q);
});

test("bad URL values fall back to defaults instead of throwing", () => {
  const q = parseQuery(sp("library=nope&sort=bad&min=-5&max=abc&genres=,,"));
  assert.deepEqual(q, DEFAULT_QUERY);
});

test("API params leave out defaults and unset bounds", () => {
  assert.deepEqual(toApiParams(DEFAULT_QUERY, 24, 0), { q: undefined, genres: undefined, min_price: undefined, max_price: undefined, library: "not_owned", sort: "relevance", limit: 24, offset: 0 });
  const p = toApiParams({ ...DEFAULT_QUERY, q: " hades ", genres: ["RPG", "Indie"], maxPrice: 0 }, 5, 10);
  assert.equal(p.q, "hades");
  assert.equal(p.genres, "RPG,Indie");
  assert.equal(p.max_price, 0);   // "free only" is a real bound, not "no limit"
  assert.equal(p.offset, 10);
});

test("filter count ignores text and sort; clearing keeps them", () => {
  assert.equal(activeFilterCount({ ...DEFAULT_QUERY, q: "x", sort: "newest" }), 0);
  const q = { ...DEFAULT_QUERY, q: "x", sort: "newest" as const, genres: ["RPG", "Indie"], maxPrice: 5, library: "owned" as const };
  assert.equal(activeFilterCount(q), 4);
  assert.deepEqual(clearFilters(q), { ...DEFAULT_QUERY, q: "x", sort: "newest" });
});

test("genre toggle is case-insensitive and does not mutate", () => {
  const a = { ...DEFAULT_QUERY, genres: ["RPG"] };
  assert.deepEqual(toggleGenre(a, "rpg").genres, []);
  assert.deepEqual(toggleGenre(a, "Indie").genres, ["RPG", "Indie"]);
  assert.deepEqual(a.genres, ["RPG"]);
});

test("price slider maps steps to Toman and back", () => {
  assert.equal(stepToToman(0, 5000000), 0);
  assert.equal(stepToToman(SLIDER_STEPS, 5000000), 5000000);
  assert.equal(tomanToStep(2500000, 5000000), SLIDER_STEPS / 2);
  assert.equal(tomanToStep(9e9, 5000000), SLIDER_STEPS);
  assert.equal(tomanToStep(10, 0), 0);
});
