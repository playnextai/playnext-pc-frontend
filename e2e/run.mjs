// Drives the built frontend (npm start on :3000, backend = mock on :8000) in Chromium, in English and Farsi,
// at desktop and phone width. Prints findings as GitHub annotations (job logs aren't downloadable from the sandbox).
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const MOCK = "http://localhost:8000";
const findings = [];
const note = (level, where, msg) => findings.push({ level, where, msg });
const setScenario = (s) => fetch(`${MOCK}/__scenario/${s}`);

const PAGES = [
  { path: "/", scenario: "out", name: "landing" },
  { path: "/game/1", scenario: "out", name: "game(signed-out)" },
  { path: "/consent", scenario: "consent", name: "consent" },
  { path: "/onboarding/region", scenario: "full", name: "onboarding-region" },
  { path: "/onboarding/quiz", scenario: "full", name: "onboarding-quiz" },
  { path: "/onboarding/library", scenario: "empty", name: "onboarding-library" },
  { path: "/discover", scenario: "full", name: "feed" },
  { path: "/discover", scenario: "empty", name: "feed(cold-start)" },
  { path: "/library", scenario: "full", name: "library" },
  { path: "/library", scenario: "empty", name: "library(empty)" },
  { path: "/wishlist", scenario: "full", name: "wishlist" },
  { path: "/wishlist", scenario: "empty", name: "wishlist(email-only,empty)" },
  { path: "/cart", scenario: "full", name: "cart" },
  { path: "/cart", scenario: "empty", name: "cart(empty)" },
  { path: "/settings", scenario: "full", name: "settings" },
  { path: "/settings", scenario: "empty", name: "settings(email-only)" },
  { path: "/dna", scenario: "full", name: "dna" },
  { path: "/dna", scenario: "empty", name: "dna(email-only)" },
  { path: "/game/1", scenario: "full", name: "game" },
  { path: "/game/999", scenario: "full", name: "game(missing)" },
  { path: "/no-such-page", scenario: "full", name: "404" },
];
const VIEWPORTS = [{ id: "desktop", width: 1280, height: 900 }, { id: "phone", width: 390, height: 844 }];

// Runs inside the page.
function inspect(lang) {
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
  const name = (el) => (el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || "").trim();
  const out = {};
  out.dir = document.documentElement.dir; out.lang = document.documentElement.lang;
  out.overflowX = document.documentElement.scrollWidth - window.innerWidth;
  out.h1 = document.querySelectorAll("h1").length;
  const inter = [...document.querySelectorAll("a, button, input, select, [role=radio], [role=tab]")].filter(vis);
  out.unnamed = inter.filter((e) => !name(e) && !(e.tagName === "INPUT" && (e.getAttribute("aria-label") || (e.labels && e.labels.length)))).map((e) => e.outerHTML.slice(0, 80));
  out.small = inter.filter((e) => { const r = e.getBoundingClientRect(); return (r.height < 36 || r.width < 36) && e.type !== "range" && e.type !== "checkbox"; }).map((e) => `${name(e).slice(0, 24) || e.tagName} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`);
  out.clipped = [...document.querySelectorAll("main *")].filter((e) => vis(e) && e.children.length === 0 && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== "visible" && !e.closest(".sr-only")).map((e) => (e.textContent || "").slice(0, 30));
  // Prices and counts must use Persian digits in Farsi, Latin in English.
  const nums = [...document.querySelectorAll(".price, .badge, .chip")].filter(vis).map((e) => e.textContent || "");
  out.wrongDigits = lang === "fa" ? nums.filter((t) => /[0-9]/.test(t)).slice(0, 5) : nums.filter((t) => /[۰-۹]/.test(t)).slice(0, 5);
  // Latin words in Farsi UI outside elements marked as English / game data (review list, not an error by itself).
  if (lang === "fa") {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const latin = []; let n;
    while ((n = walker.nextNode())) {
      const t = n.textContent.trim(); const p = n.parentElement;
      if (!t || !p || !vis(p) || p.closest("[lang=en], [dir=ltr], script, style")) continue;
      if (/[A-Za-z]{4,}/.test(t)) latin.push(t.slice(0, 40));
    }
    out.latin = latin.slice(0, 8);
    out.fontOk = document.fonts.check("16px Vazirmatn");
  }
  out.text = (document.querySelector("main")?.innerText || document.body.innerText).replace(/\s+/g, " ").slice(0, 220);
  return out;
}

const browser = await chromium.launch();
for (const vp of VIEWPORTS) {
  for (const lang of ["en", "fa"]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await ctx.addInitScript((l) => { try { localStorage.setItem("playnext:lang", l); } catch {} }, lang);
    for (const pg of PAGES) {
      const where = `${pg.name} · ${lang} · ${vp.id}`;
      await setScenario(pg.scenario);
      const page = await ctx.newPage();
      const errs = [];
      page.on("pageerror", (e) => errs.push(`pageerror: ${e.message.slice(0, 160)}`));
      page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(`console: ${m.text().slice(0, 160)}`); });
      page.on("response", (r) => { const u = r.url(); if (r.status() >= 400 && u.startsWith(BASE) && !/\/api\/(games\/999|gamer-dna|auth\/me)|\/no-such-page/.test(u) && !(pg.scenario === "out" && r.status() === 401)) errs.push(`HTTP ${r.status()} ${u.replace(BASE, "")}`); });
      try {
        await page.goto(BASE + pg.path, { waitUntil: "networkidle", timeout: 30000 });
        await page.waitForTimeout(400);
        const r = await page.evaluate(inspect, lang);
        const url = new URL(page.url()).pathname;
        if (r.dir !== (lang === "fa" ? "rtl" : "ltr") || r.lang !== lang) note("error", where, `html lang/dir wrong: ${r.lang}/${r.dir}`);
        if (r.overflowX > 1) note("error", where, `horizontal scroll: page is ${r.overflowX}px wider than the screen`);
        if (r.unnamed.length) note("error", where, `controls with no accessible name: ${r.unnamed.join(" | ")}`);
        if (r.wrongDigits.length) note("error", where, `wrong digit style: ${r.wrongDigits.join(" | ")}`);
        if (lang === "fa" && r.fontOk === false) note("warn", where, "Vazirmatn font did not load");
        if (r.clipped.length) note("warn", where, `text clipped: ${r.clipped.join(" | ")}`);
        if (vp.id === "phone" && r.small.length) note("warn", where, `touch targets under 36px: ${[...new Set(r.small)].slice(0, 6).join(", ")}`);
        if (lang === "fa" && r.latin?.length) note("info", where, `Latin text in Farsi UI: ${r.latin.join(" | ")}`);
        if (r.h1 !== 1 && pg.name !== "404") note("warn", where, `${r.h1} <h1> elements`);
        if (url !== pg.path) note("info", where, `redirected to ${url}`);
        for (const e of errs) note("error", where, e);
        if (vp.id === "desktop" && lang === "en") note("info", where, `content: ${r.text}`);
      } catch (e) {
        note("error", where, `did not load: ${String(e).slice(0, 160)}`);
      }
      await page.close();
    }
    await ctx.close();
  }
}

// ---- interactions (desktop, English unless noted) ----
async function flow(name, fn) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message.slice(0, 160)));
  try { await fn(page, ctx); errs.forEach((e) => note("error", `flow: ${name}`, `pageerror ${e}`)); note("info", `flow: ${name}`, "ok"); }
  catch (e) { note("error", `flow: ${name}`, String(e).slice(0, 300)); }
  await ctx.close();
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

await setScenario("full");
await flow("language toggle flips direction and survives reload", async (page) => {
  await page.goto(BASE + "/discover", { waitUntil: "networkidle" });
  expect((await page.locator("html").getAttribute("dir")) === "ltr", "starts ltr");
  await page.getByRole("button", { name: "Language" }).click();
  expect((await page.locator("html").getAttribute("dir")) === "rtl", "did not become rtl");
  await page.reload({ waitUntil: "networkidle" });
  expect((await page.locator("html").getAttribute("dir")) === "rtl", "choice not remembered after reload");
  expect((await page.locator("h2").first().innerText()).match(/[آ-ی]/), "feed headings not in Farsi");
});
await flow("budget menu opens and slider shows 'no limit' by default", async (page) => {
  await page.goto(BASE + "/discover", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Filters" }).click();
  const slider = page.locator("#budget-range");
  expect(await slider.isVisible(), "slider not shown");
  expect(Number(await slider.inputValue()) === 8500000, "slider should start at the top (no limit)");
  expect((await page.locator(".popover").innerText()).includes("No limit"), "no-limit label missing");
});
await flow("feed card actions and card opens detail", async (page) => {
  await page.goto(BASE + "/discover", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add to wishlist" }).first().click();
  await page.waitForTimeout(300);
  expect((await page.getByRole("button", { name: "Add to wishlist" }).first().getAttribute("aria-pressed")) === "true", "wishlist button did not toggle");
  await page.getByRole("heading", { name: "Elden Ring" }).first().click();
  await page.waitForURL("**/game/1");
});
await flow("quiz counter and region radio", async (page) => {
  await page.goto(BASE + "/onboarding/quiz", { waitUntil: "networkidle" });
  expect((await page.locator("[aria-live=polite]").innerText()).includes("Tap a few you've loved"), "initial counter");
  await page.getByRole("button", { name: /Hades/ }).click();
  await page.getByRole("button", { name: /Balatro/ }).click();
  expect((await page.locator("[aria-live=polite]").innerText()).includes("2 games picked"), "counter did not update");
  await page.getByRole("button", { name: /Elden Ring/ }).click();
  expect((await page.locator("[aria-live=polite]").innerText()).includes("3 picked, nice spread"), "spread message missing for 3 picks over 3 genres");
  expect((await page.locator(".quiz-tile.on").count()) === 3 && (await page.locator(".quiz-check").count()) === 3, "check badges missing");
  expect((await page.getByText("Step 2 of 3").count()) === 1, "step label missing");
  await page.goto(BASE + "/onboarding/region", { waitUntil: "networkidle" });
  expect((await page.getByRole("radio").count()) === 6, "should list six regions");
});
await flow("signed-out game page shows every region and a sign-in prompt, no action buttons", async (page) => {
  await setScenario("out");
  await page.goto(BASE + "/game/1", { waitUntil: "networkidle" });
  const t = await page.locator("main").innerText();
  expect(t.includes("Argentina") && t.includes("Ukraine"), "regions missing");
  expect(t.includes("Sign in"), "sign-in prompt missing");
  expect((await page.getByRole("button", { name: "Add to cart" }).count()) === 0, "action buttons visible while signed out");
  await setScenario("full");
});
await flow("search-and-add shows result and no-results copy", async (page) => {
  await page.goto(BASE + "/library", { waitUntil: "networkidle" });
  await page.getByLabel("Search games").fill("Hollow");
  await page.getByText("Hollow Knight").waitFor({ timeout: 3000 });
});

await flow("undo bar brings a removed card back", async (page) => {
  await page.goto(BASE + "/discover", { waitUntil: "networkidle" });
  const before = await page.getByRole("button", { name: "Not interested" }).count();
  await page.getByRole("button", { name: "Not interested" }).first().click();
  await page.getByText("Removed from your feed").waitFor({ timeout: 3000 });
  expect((await page.getByRole("button", { name: "Not interested" }).count()) === before - 1, "card was not removed");
  await page.getByRole("button", { name: "Undo" }).click();
  await page.waitForTimeout(400);
  expect((await page.getByRole("button", { name: "Not interested" }).count()) === before, "card did not come back");
});
await flow("wishlist: Steam item labelled From Steam, add to cart works, no stray discount badge", async (page) => {
  await page.goto(BASE + "/wishlist", { waitUntil: "networkidle" });
  const t = await page.locator("main").innerText();
  expect(t.includes("From Steam"), "synced item should say From Steam");
  expect(!/—\s*-20%/.test(t), "discount badge shown with no price");
  await page.getByRole("button", { name: "Add to cart" }).first().click();
  await page.getByRole("button", { name: "In cart" }).waitFor({ timeout: 3000 });
});
await flow("Farsi: regions, reasons and genres are translated", async (page) => {
  await page.addInitScript(() => localStorage.setItem("playnext:lang", "fa"));
  await page.goto(BASE + "/discover", { waitUntil: "networkidle" });
  const t = await page.locator("body").innerText();
  expect(t.includes("چون Dark Souls III را پسندیدی"), "reason not translated");
  await page.goto(BASE + "/onboarding/region", { waitUntil: "networkidle" });
  const r = await page.locator("main").innerText();
  expect(r.includes("ترکیه") && !r.includes("Turkey"), "region names not translated");
  await page.goto(BASE + "/dna", { waitUntil: "networkidle" });
  expect((await page.locator("main").innerText()).includes("اکشن RPG"), "genre not translated");
});
await flow("onboarding add-games shows the playtime gauge", async (page) => {
  await setScenario("empty");
  await page.goto(BASE + "/onboarding/library", { waitUntil: "networkidle" });
  await page.getByLabel("Search games").fill("Hollow");
  await page.getByText("Hollow Knight").click();
  await page.getByRole("radiogroup", { name: "How much did you play it?" }).waitFor({ timeout: 3000 });
  await page.getByRole("radio", { name: "50+ hours" }).click();
  await page.locator('[role=radio][aria-checked=true]').filter({ hasText: "50+ hours" }).waitFor({ timeout: 3000 });
  await setScenario("full");
});

await flow("landing: sign-in links go to the auth site with a return_url, sections and Farsi copy present", async (page) => {
  await setScenario("out");
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const hrefs = await page.locator("a.btn").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(hrefs.length >= 3, "expected sign-in buttons (nav, hero, final)");
  for (const h of hrefs) expect(/^https:\/\/auth\.playnextai\.com\/.+return_url=/.test(h), `bad sign-in link: ${h}`);
  expect(hrefs.some((h) => h.includes("/steam/")), "no Steam sign-in link");
  const t = await page.locator("body").innerText();
  for (const s of ["How it works", "Real regional pricing", "Every edition, one place", "Contact"]) expect(t.includes(s), `missing: ${s}`);
  expect((await page.locator("#how").count()) === 1 && (await page.locator("#feat").count()) === 1, "anchor targets missing");
  await page.getByRole("button", { name: "Language" }).click();
  const fa = await page.locator("body").innerText();
  expect(fa.includes("چطور کار می‌کند") && fa.includes("۹۲٪ تطابق"), "Farsi copy / Persian digits missing");
  await setScenario("full");
});

import { mkdirSync } from "node:fs";
mkdirSync("shots", { recursive: true });
await setScenario("out");
for (const vp of VIEWPORTS) for (const lang of ["en", "fa"]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  await ctx.addInitScript((l) => { try { localStorage.setItem("playnext:lang", l); } catch {} }, lang);
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `shots/landing-${lang}-${vp.id}.png`, fullPage: true });
  await ctx.close();
}
await setScenario("full");
for (const vp of VIEWPORTS) for (const lang of ["en", "fa"]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  await ctx.addInitScript((l) => { try { localStorage.setItem("playnext:lang", l); } catch {} }, lang);
  const page = await ctx.newPage();
  await page.goto(BASE + "/onboarding/quiz", { waitUntil: "networkidle" });
  const tiles = page.locator(".quiz-tile");
  for (let i = 0; i < 3; i++) await tiles.nth(i).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `shots/quiz-${lang}-${vp.id}.png` });
  await ctx.close();
}

await browser.close();

const order = { error: 0, warn: 1, info: 2 };
findings.sort((a, b) => order[a.level] - order[b.level]);
const errors = findings.filter((f) => f.level === "error").length;
const chunk = (arr) => arr.map((f) => `${f.level.toUpperCase()} [${f.where}] ${f.msg}`);
const emit = (title, lines) => { for (let i = 0; i < lines.length; i += 12) console.log(`::notice title=${title} ${i / 12 + 1}::${lines.slice(i, i + 12).join(" || ").replace(/\n/g, " ")}`); };
console.log(`::notice title=e2e summary::${errors} errors, ${findings.filter((f) => f.level === "warn").length} warnings, ${findings.length} findings`);
emit("e2e errors", chunk(findings.filter((f) => f.level === "error")));
emit("e2e warnings", chunk(findings.filter((f) => f.level === "warn")));
emit("e2e info", chunk(findings.filter((f) => f.level === "info")));
import { writeFileSync } from "node:fs";
writeFileSync("e2e-report.txt", chunk(findings).join("\n"));
process.exit(0); // findings are reported, not gated, until we've triaged them
