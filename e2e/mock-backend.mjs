// A tiny stand-in for the Python backend so the real frontend can be driven in a browser by CI.
// Response shapes follow PHASE_9_CONTRACT.md / lib/types.ts. Switch scenario: GET /__scenario/<name>
//   full     signed in, Steam linked, lots of data
//   empty    signed in, email only, nothing yet (cold start, empty cart, DNA gated)
//   out      signed out
//   consent  signed in but consent_required
import http from "node:http";

let scenario = "full";
const cover = null; // placeholders (the design's gradient box); real covers are IGDB URLs
const price = (t, n, c, d = null) => ({ price_toman: t, price_native: n, price_currency: c, discount_pct: d });
const card = (id, title, extra = {}) => ({ game_id: id, title, cover_url: cover, genres: ["Action RPG"], ...price(3317470, 1249.5, "TRY", id % 2 ? 20 : null), ...extra });
const CARDS = [card(1, "Elden Ring", { reason: "Because you liked Dark Souls III" }), card(2, "Hades"), card(3, "Baldur's Gate 3", { price_toman: null, price_native: null, price_currency: null }), card(4, "Balatro")];
const regionOptions = ["US:United States", "UK:United Kingdom", "EU:Europe (Eurozone)", "UA:Ukraine", "TR:Turkey", "AR:Argentina"].map((x) => { const [code, label] = x.split(":"); return { code, label }; });

const settings = () => ({
  display_name: "Arash", email: "arash@example.com", steam_linked: scenario === "full", region: "TR",
  budget_ceiling_toman: null, region_options: regionOptions, budget_max_toman: 8500000,
});
const detail = (signedIn) => ({
  game_id: 1, title: "Elden Ring", description: "A vast open world action RPG from FromSoftware and George R. R. Martin.",
  developer: "FromSoftware", publisher: "Bandai Namco", genres: ["Action RPG", "Open World"], tags: ["Souls-like", "Difficult", "Fantasy"],
  platforms: ["pc"], release_year: 2022, review_score: 92, cover_url: cover,
  editions: [{ game_edition_id: 11, edition_name: "Standard Edition", is_primary: true, platforms: ["steam"], buy_url: "https://store.steampowered.com/app/1245620",
    prices: ["US:USD:59.99", "UK:GBP:49.99", "EU:EUR:59.99", "UA:UAH:1999", "TR:TRY:1249.5", "AR:USD:30"].map((x, i) => { const [region, cur, p] = x.split(":"); return { region, is_user_region: signedIn && region === "TR", is_free: false, ...price(3317470 - i * 100000, Number(p), cur, i === 4 ? 20 : null) }; }) }],
  user_state: { owned: false, wishlisted: false, in_cart: false, feedback: null },
  recommendation: signedIn ? { reason: "Because you liked Dark Souls III", score: 0.9, kind: "new_game" } : null,
  similar: [{ game_id: 2, title: "Hades", cover_url: cover, similarity: 0.8, ...price(1200000, 400, "TRY", null) }],
});

function route(method, path) {
  const s = scenario;
  const full = s === "full";
  const empty = s === "empty";
  const authed = s !== "out";
  if (path === "/auth/me") return authed ? { authenticated: true, user: { id: 1, display_name: "Arash" }, consent_required: s === "consent" } : { authenticated: false };
  if (!authed && path !== "/games/1") return [401, { detail: "not_authenticated" }];
  if (path === "/onboarding/status") return { complete: true, next_step: null, next_route: null, steps: { region: true, quiz: true, library: true } };
  if (path === "/settings") return settings();
  if (path === "/cart") return empty ? { platforms: [], count: 0, total_toman: 0, region: "TR", disclaimer: "" } : {
    platforms: [{ platform: "steam", items: [
      { item_id: 1, game_id: 1, game_edition_id: 11, title: "Elden Ring", edition_name: "Standard Edition", cover_url: cover, price_toman_locked: 3000000, source_price: 1249.5, source_currency: "TRY", price_toman_now: 3317470, price_changed: true, buy_url: "https://store.steampowered.com/app/1245620" },
      { item_id: 2, game_id: 2, game_edition_id: 21, title: "Hades", edition_name: null, cover_url: cover, price_toman_locked: 1200000, source_price: 400, source_currency: "TRY", price_toman_now: 1200000, price_changed: false, buy_url: null }] }],
    count: 2, total_toman: 4517470, region: "TR", disclaimer: "Prices are estimates from Steam's regional stores converted at today's rate." };
  if (path.startsWith("/recommendations")) return { recommendations: empty ? [] : CARDS };
  if (path.startsWith("/feed/unplayed")) return { items: empty ? [] : [CARDS[1]] };
  if (path.startsWith("/feed/deals")) return { items: empty ? [] : [CARDS[0], CARDS[3]] };
  if (path.startsWith("/feed/out-of-usual")) return { items: empty ? [] : [CARDS[2]] };
  if (path.startsWith("/popular")) return { items: [CARDS[2], CARDS[3]] };
  if (path.startsWith("/library/sync-status")) return { status: full ? "done" : "not_applicable", last_synced: null };
  if (path.startsWith("/library")) return empty ? { items: [], count: 0 } : { count: 3, items: [
    { game_id: 1, title: "Elden Ring", cover_url: cover, source: "steam_sync", removable: false, playtime_hours: 89.4, playtime_bucket: null, user_rating: null },
    { game_id: 2, title: "Hades", cover_url: cover, source: "manual", removable: true, playtime_hours: null, playtime_bucket: "some_hours", user_rating: null },
    { game_id: 4, title: "Balatro", cover_url: cover, source: "manual", removable: true, playtime_hours: null, playtime_bucket: "sunk_50plus", user_rating: 5 }] };
  if (path.startsWith("/wishlist")) return empty ? { items: [], count: 0, region: "TR" } : { count: 2, region: "TR", items: [
    { game_id: 3, title: "Baldur's Gate 3", cover_url: cover, source: "steam_sync", removable: false, added_at: null, game_edition_id: 31, ...price(3317470, 1249.5, "TRY", 20) },
    { game_id: 4, title: "Balatro", cover_url: cover, source: "manual", removable: true, added_at: null, game_edition_id: null, ...price(null, null, null, 20) }] };
  if (path.startsWith("/games/search")) return { results: [{ game_id: 5, title: "Hollow Knight", developer: "Team Cherry", release_year: 2017, cover_url: cover }] };
  if (path.startsWith("/onboarding/quiz-options")) return { options: CARDS.map((c) => ({ game_id: c.game_id, title: c.title, genres: c.genres, cover_url: cover })) };
  if (path === "/games/1") return detail(authed);
  if (path.startsWith("/games/")) return [404, { detail: "game_not_found" }];
  if (path === "/gamer-dna") return empty ? [403, { detail: "steam_required" }] : {
    has_data: true, games_count: 40, total_hours: 412.3, backlog_count: 7, avg_achievement_completion: 0.63,
    most_played_studio: { name: "FromSoftware", hours: 160 }, top_genres: [{ genre: "Action RPG", hours: 156 }, { genre: "Roguelike", hours: 98 }, { genre: "Strategy", hours: 61 }],
    most_played_game: { game_id: 1, title: "Elden Ring", hours: 89, cover_url: cover }, type_label: "The Genre Explorer" };
  return { status: "ok" };
}

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const m = url.pathname.match(/^\/__scenario\/(\w+)$/);
  let status = 200, body;
  if (m) { scenario = m[1]; body = { scenario }; }
  else { const r = route(req.method, url.pathname + url.search); if (Array.isArray(r)) [status, body] = r; else body = r; }
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}).listen(8000, () => console.log("mock backend on :8000"));
