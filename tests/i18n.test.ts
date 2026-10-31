import test from "node:test";
import assert from "node:assert/strict";
import {
  detectLang, dirOf, en, fa, hoursText, nativeText, percentText, placeholdersOf, saveLang, toPersianNumerals,
  tomanText, translate, type Key,
} from "../lib/i18n.ts";

const keys = Object.keys(en) as Key[];

test("every English string has a Farsi twin with the same {placeholders}, and no Farsi string is empty", () => {
  assert.deepEqual(Object.keys(fa).sort(), [...keys].sort());
  for (const k of keys) {
    assert.ok(fa[k].trim().length > 0, `empty fa: ${k}`);
    assert.deepEqual(placeholdersOf(fa[k]), placeholdersOf(en[k]), `placeholders differ: ${k}`);
  }
});

test("Farsi is right-to-left, English left-to-right", () => {
  assert.equal(dirOf("fa"), "rtl");
  assert.equal(dirOf("en"), "ltr");
});

test("Toman is primary, missing price is a dash never zero, Farsi uses Persian numerals", () => {
  assert.equal(tomanText(null, "en"), "—");
  assert.equal(tomanText(undefined, "fa"), "—");
  assert.equal(tomanText(3317470, "en"), "3,317,470 Toman");
  const f = tomanText(3317470, "fa");
  assert.ok(f.endsWith(" تومان"));
  assert.ok(/^[۰-۹٬]+ تومان$/.test(f), f);
});

test("native price keeps its currency symbol and localizes digits in Farsi", () => {
  assert.equal(nativeText(49.99, "TRY", "en"), "₺49.99");
  assert.equal(nativeText(49.99, "TRY", "fa"), "₺۴۹٫۹۹");
  assert.equal(nativeText(10, "UAH", "en"), "₴10.00");
  assert.equal(nativeText(9.99, "USD", "en"), "$9.99");
  assert.equal(nativeText(9.99, "USD", "fa"), "$۹٫۹۹");
  assert.equal(nativeText(null, "USD", "en"), null);
  assert.equal(nativeText(5, null, "fa"), null);
  assert.equal(toPersianNumerals("1,234.5"), "۱٬۲۳۴٫۵");
});

test("percent and hours follow the language", () => {
  assert.equal(percentText(63, "en"), "63%");
  assert.equal(percentText(63, "fa"), "۶۳٪");
  assert.equal(hoursText(412, "en"), "412 hrs");
  assert.equal(hoursText(412, "fa"), "۴۱۲ ساعت");
});

test("translate fills placeholders and shows numbers in the language's digits", () => {
  assert.equal(translate("en", "quiz.many", { n: 5 }), "5 games picked");
  assert.equal(translate("fa", "quiz.many", { n: 5 }), "۵ بازی انتخاب شد");
  assert.equal(translate("en", "cart.buy", { platform: "Steam" }), "Buy on Steam");
  assert.equal(translate("en", "common.rateLimited"), "Too many requests. Try again in {n} seconds.");
});

test("language comes from the saved choice, else the browser, else English; broken storage never throws", () => {
  const mem = new Map<string, string>();
  const store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
  assert.equal(detectLang("fa-IR", store), "fa");
  assert.equal(detectLang("en-GB", store), "en");
  assert.equal(detectLang(null, store), "en");
  saveLang("fa", store);
  assert.equal(detectLang("en-US", store), "fa");
  mem.set("playnext:lang", "xx");
  assert.equal(detectLang("en-US", store), "en");
  const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
  assert.equal(detectLang("fa", broken), "fa");
  assert.doesNotThrow(() => saveLang("en", broken));
  assert.equal(detectLang("en", null), "en");
});
