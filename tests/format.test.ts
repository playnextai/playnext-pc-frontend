import test from "node:test";
import assert from "node:assert/strict";
import { formatNative, formatToman } from "../lib/format.ts";

test("missing price renders a dash, never 0", () => {
  assert.equal(formatToman(null), "—");
  assert.equal(formatToman(undefined), "—");
});
test("toman has a unit", () => {
  assert.ok(formatToman(20000, "en-US").endsWith("Toman"));
  assert.ok(formatToman(20000, "fa-IR").endsWith("تومان"));
});
test("native price formats or is null", () => {
  assert.equal(formatNative(9.99, "USD"), "$9.99");
  assert.equal(formatNative(null, "USD"), null);
  assert.equal(formatNative(5, null), null);
});
