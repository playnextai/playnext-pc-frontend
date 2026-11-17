# PlayNext:PC Frontend — Complete Setup, Compile and Test Guide

**Audience:** you (or a new developer) with this repository (`playnextai/playnext-pc-frontend`) and nothing else set up. **Goal:** compile it, run it, and prove each screen works, in English and in Farsi.

**Last reviewed: 2026-11-15.** Companion documents in the backend repository (`playnextai/playnext-pc-backend`): `docs/SETUP.md` (including **15.2, the Global Auth staging test**), `docs/API_CONTRACT.md` (every endpoint), `docs/GLOBAL_AUTH_INTEGRATION.md`.

## What has and has not been verified (read first)

| Verified automatically on every push (GitHub Actions, `frontend-ci`) | Never verified |
|---|---|
| `npm run typecheck`, `npm test` (50 tests), `npm run build` on a clean machine (job `check`). | Anything against the **real backend**: real Postgres data, Steam, Redis, Celery, IGDB covers, Bonbast rates. |
| A real Chromium browser drives every page against a **mock backend** in English and Farsi, at desktop (1280 px) and phone (390 px) width, and checks layout, direction, digits, clipped text, touch targets, unnamed controls, plus 21 named user flows (job `e2e`). It also saves screenshots. | The real **Global Auth** service: cross-subdomain cookie over HTTPS, real `/auth/me` and `/auth/identities` answers, central logout. Steps: backend guide 15.2. |
| | Real phones/browsers other than Chromium; a screen-reader and keyboard audit; performance. |

So: the code compiles, builds and passes the mock-backend browser tests. Section 8 is your manual check against the real backend, which is the first time those two meet.

---

## Contents

1. What this app is (and is not)
2. Prerequisites
3. Install
4. Configuration (environment variables)
5. Compile: typecheck, tests, build
6. Run it locally
7. Getting a signed-in session on localhost
8. Manual test script, page by page
9. Automated tests: what they cover and what they cannot
10. Troubleshooting
11. Deployment notes (preview of Phase 10)
12. Known unverified items and open decisions
13. Project map and how to add a page

---

## 1. What this app is (and is not)

PlayNext:PC's web frontend: Next.js 15 (App Router) + React 19 + TypeScript, served at `pc.playnextai.com`. A **separate repository** from the Python backend. **Bilingual:** English (left-to-right) and Farsi (right-to-left, Persian digits), switchable at any time.

**Rules it follows (do not break them when adding code):**

| Rule | Why | Where |
|---|---|---|
| **No sign-in UI here.** Every sign-in is a redirect to the central auth site: `https://auth.playnextai.com/login?return_url=<PC callback>`. The PC callback `/auth/sso/callback` asks the backend who the session belongs to and applies PC onboarding. Linking Steam/Google, account management and sign-out are also Auth's (links and a form POST). | Global Auth owns identity, sign-in methods, sessions and logout. Contract: "PlayNext:PC - Global Auth Integration Hand-off" v1.0 (Auth B2 0.3.0), summarized in the backend repo's `docs/GLOBAL_AUTH_INTEGRATION.md`. | `lib/auth.ts` is the only file that knows Auth URLs; `app/auth/sso/callback/page.tsx` |
| The browser only calls **same-origin `/api/*`**, which Next forwards to the backend. | No CORS, and the session cookie flows through untouched. | `next.config.mjs` |
| The client **never sends a user id**. | The backend takes it from the session (it asks Global Auth). | `lib/api.ts` |
| Every signed-in page is wrapped in the **gate**: signed out → auth site; consent needed → `/consent`; onboarding unfinished → the next step. | Onboarding is tracked by the backend (`GET /onboarding/status`), never guessed from "new account". | `components/Gate.tsx`, `lib/flow.ts` |
| **Toman is the primary price**, the native regional price is secondary; a missing price shows "—", never 0. Persian digits in Farsi mode. | Product decision. | `lib/format.ts`, `lib/i18n.ts` (`toman`, `native`, `num`) |
| **Every visible string lives in `lib/i18n.ts`** as an English and a Farsi entry (the type checker enforces the same keys; a test enforces the same `{placeholders}`). Game descriptions stay English. | Bilingual product decision. | `lib/i18n.ts`, `tests/i18n.test.ts` |
| The language choice is stored **in this browser only** (`localStorage` key `playnext:lang`), not in the account. | Decision. | `components/I18nProvider.tsx` |
| Design tokens (dark theme, mint/lime/lilac accents, Inter + Vazirmatn fonts, logical CSS properties for RTL, inline SVG icons, no emoji). | Matches the approved design board. | `app/globals.css`, `components/Icon.tsx` |

**Request path:** `Browser → /api/foo (this site) → Next rewrite → BACKEND_URL/foo (FastAPI)`.

**Pages that exist:** landing `/`; `/auth/sso/callback`; `/consent`; onboarding `/onboarding/region`, `/onboarding/quiz`, `/onboarding/library`; the feed `/discover`; `/library`; `/wishlist`; `/cart`; `/game/[id]` (public, signed-out visitors can read it); `/dna` (Gamer DNA); `/settings`; plus a 404 page and an error page. The top navigation (Library, Wishlist, Gamer DNA, Cart with badge, budget/filters chip, region chip, language toggle, avatar) is on every signed-in page.

---

## 2. Prerequisites

- **Node.js 22.6 or newer** (the current LTS is fine). Check: `node -v`. The test command uses Node's built-in TypeScript stripping, which needs ≥ 22.6.
- **npm** (comes with Node). Check: `npm -v`.
- **The backend** if you want real data (section 6). Compiling, the unit tests and the mock-backend mode need none.
- A modern browser (Chrome, Edge or Firefox).
- Internet access for `npm install`.

---

## 3. Install

1. Clone the repository (or unzip it) somewhere without spaces in the path. The folder containing `package.json` is **the project root**; run every command from there.
2. Create your local env file:
   - macOS/Linux: `cp .env.example .env.local`
   - Windows PowerShell: `copy .env.example .env.local`
3. Install dependencies: `npm install`
   - Creates `node_modules/` and `package-lock.json`. **Commit `package-lock.json`** — it pins exact versions; `package.json` only has ranges (`^15`, `^19`, `^5.6`). (CI uses `npm ci` once a lockfile exists.)
4. Never commit `.env.local` or `node_modules/` (`.gitignore` already excludes them).

---

## 4. Configuration (environment variables)

Edit `.env.local`:

| Variable | Default | Meaning | When it is read |
|---|---|---|---|
| `BACKEND_URL` | `http://localhost:8000` | Where `/api/*` is forwarded (the FastAPI server). Server-side only. | **At build time and server start** (rewrites are fixed when the build runs) |
| `NEXT_PUBLIC_SITE_URL` | `https://pc.playnextai.com` | This site's public origin. Used to build the PC callback (`/auth/sso/callback`) that is sent to the auth site as `return_url`. | **Baked into the JavaScript at build time** |
| `NEXT_PUBLIC_AUTH_URL` | `https://auth.playnextai.com` | The Global Auth site (sign-in `/login`, linking `/auth/steam/link` and `/auth/google/link`, account `/`, sign-out `/auth/logout`). The paths are fixed by the contract, not configurable. | Baked at build time |

Important gotchas:
- Anything starting with `NEXT_PUBLIC_` is compiled into the browser code. **Changing it requires a rebuild** (`npm run build`), or a restart of `npm run dev`.
- Never put secrets in a `NEXT_PUBLIC_*` variable. This app needs no secrets at all.
- For local work set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.
- The old `NEXT_PUBLIC_AUTH_LOGIN_PATH` and `NEXT_PUBLIC_AUTH_STEAM_PATH` settings no longer exist; if they are in your `.env.local`, delete them.

---

## 5. Compile: typecheck, tests, build

Run these three, in this order, from the project root. CI runs exactly these (plus the browser tests) on every push.

### 5.1 `npm run typecheck`
Runs `tsc --noEmit` over everything. Expected: no output and exit code 0. If it complains that `next-env.d.ts` is missing, run `npm run dev` or `npm run build` once; Next generates it.

### 5.2 `npm test`
Runs the eight test files in `tests/` with Node's built-in runner. Expected: `# pass 50`, `# fail 0` (the number grows as tests are added; there must be no failures). If it fails to start, check `node -v` ≥ 22.6.

### 5.3 `npm run build`
Production build. It type-checks again and compiles every route. Expected end state: a route table without errors. Routes: `/`, `/auth/sso/callback`, `/cart`, `/consent`, `/discover`, `/dna`, `/game/[id]`, `/library`, `/onboarding/library`, `/onboarding/quiz`, `/onboarding/region`, `/settings`, `/wishlist` and the 404 page.

| Message | Meaning / fix |
|---|---|
| `useSearchParams() should be wrapped in a suspense boundary` | A page uses it without `<Suspense>`. Wrap that component (the callback page already does). |
| `You're importing a component that needs useState/useEffect… add "use client"` | A component is missing the `"use client"` first line. |
| `Module not found: Can't resolve '@/…'` | The `paths` alias in `tsconfig.json` is not being picked up; check you run from the project root. |
| Warnings about `<img>` | `next/image` is recommended; images are plain `<img>` on purpose for now (cover URLs come from IGDB). Safe to ignore. |

---

## 6. Run it locally

There are two ways. Use **A** for UI work without any services, **B** to test against the real backend.

### A. Against the mock backend (no database, no Redis, no sign-in)
This is the same fake backend CI uses, with realistic data for every page.
1. Terminal 1: `node e2e/mock-backend.mjs` (listens on port 8000).
2. Terminal 2: set `BACKEND_URL=http://localhost:8000` and `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.local`, then `npm run dev`.
3. Open http://localhost:3000. You are "signed in" because the mock says so. Switch scenarios by opening these URLs in the browser:
   - `http://localhost:8000/__scenario/full` — a Steam-linked person with a full library, feed, cart, DNA (default).
   - `…/__scenario/empty` — an email-only person with nothing (empty states, cold start, "Connect Steam" prompts).
   - `…/__scenario/out` — signed out (landing, sign-in redirects, the signed-out game page).
   - `…/__scenario/consent` — signed in but `consent_required` (the `/consent` screen).
   Reload the app after switching. Nothing you do is saved beyond the mock's memory.

### B. Against the real backend
1. **Start the backend first** (separate terminals), following the backend repo's `docs/SETUP.md` sections 4–9: Postgres, Redis, `uvicorn main:app --reload --port 8000`, and for the sync banner also the Celery worker. Load data (catalog, exchange rates, prices) per its section 10, otherwise the feed is empty.
2. Check the backend answers: `curl http://localhost:8000/auth/me` → `{"authenticated":false}`.
3. In `.env.local` set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` and confirm `BACKEND_URL=http://localhost:8000`.
4. Start the frontend: `npm run dev` → open **http://localhost:3000**.
5. Check the proxy works from a terminal: `curl http://localhost:3000/api/auth/me` → the same JSON as step 2. If this fails, the rewrite or `BACKEND_URL` is wrong.

With no session, any signed-in page redirects to the auth site. On localhost that sign-in **cannot bring you back** (the auth site only returns people to `*.playnextai.com`) — see section 7.

---

## 7. Getting a signed-in session on localhost

Real sign-in cannot return to `http://localhost:3000`. Use the mock backend (section 6A), or for development against the real backend only, create a test person and a session cookie by hand. **Never do this on a production database or share the cookie.**

1. **Create a test user** in the dev database (replace the email):
   ```sql
   INSERT INTO users (email, display_name) VALUES ('dev@example.com', 'Dev') RETURNING id;
   ```
   Note the `id` (say `1`). Without a consent record `/auth/me` reports `consent_required: true` and the app sends you to `/consent` — itself a good thing to test (section 8.2).
2. **Make a signed cookie value** with the backend's own signer, from the **backend** project root with its virtualenv active and the **same `SESSION_SECRET_KEY` as the running backend**:
   ```bash
   python -c "import dependencies as d; print(d.sign({'v': 1, 'user_id': 1}))"
   ```
3. **Put it in your browser:** open http://localhost:3000, DevTools → Application (Chrome/Edge) or Storage (Firefox) → Cookies → `http://localhost:3000` → add a cookie: Name `playnext_session`, Value = the printed string, Path `/`. Leave Secure off.
4. Reload. `http://localhost:3000/api/auth/me` should now show `authenticated: true`, and the gate lets you in.

This only works while the backend runs with `AUTH_SESSION_VALIDATION=legacy` (the default). In `auth` mode the backend asks Global Auth about the cookie, and a hand-made one is rejected. The cookie lasts 30 days; delete it in DevTools to test the signed-out path. The app's **Sign out** button posts to the Auth site, which cannot clear a localhost cookie.

The real sign-in is tested on staging: backend guide **15.2**.

---

## 8. Manual test script, page by page

Prerequisites: either the mock backend (6A) or backend + worker + data + a session (6B, 7). Use `psql` to confirm what the backend recorded. **Run every page once in English and once in Farsi** (language toggle in the top bar): the layout must flip right-to-left, digits must become Persian, and nothing may overflow or be cut off. Check the phone width (≈ 390 px) as well. The CI browser test checks these automatically against the mock; you are checking them against real data.

### 8.1 The gate (every signed-in page)
| Do | Expect |
|---|---|
| Delete the cookie, open `/discover` | Browser goes to `https://<auth>/login?return_url=` + the URL-encoded PC callback. For `/discover` the callback is bare (`…/auth/sso/callback`); open `/library` instead and `next=%2Flibrary` must be inside the encoded callback. |
| Cookie present, consent given, onboarding done | `/discover` renders. |
| New user (no region) opens `/discover` | Redirected to `/onboarding/region`. |
| Open `/onboarding/quiz` directly before choosing a region | The page renders (known limit), but on `/discover` you are sent back to the region step. |

### 8.2 `/consent`
Bump `PRIVACY_POLICY_VERSION` in the backend `.env` and restart it. Reload the app → redirected to `/consent`. The button stays disabled until the box is ticked; **Continue** calls `POST /auth/consent`, then re-reads `/auth/me` and only continues if `consent_required` is now false (otherwise an error stays on screen). Legacy backend mode: DB check, a new row in `user_consents`. With `AUTH_SESSION_VALIDATION=auth`, Global Auth is authoritative: the proof is Auth's own consent record (backend guide 15.2, Part E).

### 8.3 `/onboarding/region`
"Step 1" of the onboarding. A radio list of the **six pricing regions** (friendly names, not codes), each with a dot. **Continue** is disabled until one is chosen. After saving: `SELECT region FROM users WHERE id=1;` shows the code, and you are sent to the quiz. Farsi: region names are translated.

### 8.4 `/onboarding/quiz`
"Step 2". 
- A grid of **9 to 12 games, always in whole rows of three**, with covers. Tapping a tile shows a check mark and highlight. (How they are chosen: backend `quiz_router.py`; the selection logic is intentionally unchanged.)
- The bottom bar counter reads "Tap a few you've loved" → "1 game picked" → "N games picked". After **3 or more picks spanning at least 3 genres** it switches to "N picked, nice spread, we've got a read on you".
- **Let's go** works with zero picks. The **Skip, I'll figure it out as I go** link also continues.
- DB check after submit: `SELECT * FROM user_games WHERE source='quiz_seed';` has your picks; `SELECT quiz_done_at FROM pc_user_state;` is set (also after Skip).

### 8.5 `/onboarding/library`
"Step 3".
- Search needs 2+ characters; results appear after a short pause; a game already added shows "Added" and cannot be added twice. Search for nonsense → the "we'll still learn from what you add" message.
- Add a game → it appears in the list with the **playtime gauge**: one tap cycles *none → barely touched → some hours → 50+ hours (sunk) → none* (`user_games.playtime_bucket`). a heart button saves a rating of 5 (`user_games.user_rating`; it cannot be un-hearted, a known limit). **Remove** deletes the manual row.
- A Steam-linked person sees different intro copy.
- **Done / Skip for now** → `pc_user_state.library_done_at` set → `/discover`.

### 8.6 `/discover` (the feed)
- Rows (each with its own icon), in order: *Picked for you*, *What to play next*, *Still in your library*, *Good deals for you* (≥ 30 % off within budget), *Out of the usual* (under 10 % genre overlap with your play). Empty rows do not appear; **a game never shows twice**.
- Every recommendation shows one reason: "New release matching your taste", "Because you liked {title}" (with "(on your wishlist)" when relevant) or "Matches your taste profile".
- **Cold start** (new person, no data): *Popular right now* plus two buttons back to the quiz and manual add.
- Price on each card: Toman large, native price beneath; "—" when unknown; a discount badge when discounted.
- Card actions (hover / aria labels): ♥ like, ✕ not interested and ✓ already own (card disappears and an **Undo** bar appears for the last one; DB: `feedback` row, "already own" also adds a library row; Undo removes it again), bookmark = wishlist (DB: `user_wishlist`, `source='manual'`). Clicking the card opens the game page. Errors show inline.
- **Budget:** the nav chip opens a menu (on phones, the filters button opens the same menu) with a slider from 0 to the highest price in the database; the top end reads "No budget limit" and is the default. Move it → rows reload and expensive games disappear; `users.budget_ceiling_toman` is updated (null = no limit). The same control is in Settings.
- **Cart badge** shows the number of items (0 hides it).
- **Sync banner:** right after a Steam sync starts, a banner "Syncing your Steam library…" appears and clears itself when the worker finishes, then the feed reloads. To fake it: `redis-cli SET lsync:1 '{"status":"running","at":<now epoch>}'`; it turns into "couldn't sync" if older than 30 minutes.

### 8.7 `/library`
- Title "My Library"; a summary line ("N games · S synced from Steam, M added by you"); tabs **All / Synced from Steam / Added by you** (data: `GET /library?source=`).
- Steam-synced rows show real hours and a "Synced" chip and have **no Remove**. Rows you added show the same one-tap playtime gauge as in onboarding and a **Remove** button. A note explains this.
- Search-and-add at the top. Empty library: "Your library is empty"; an email-only person also gets a **Connect Steam** button that goes to Auth's Steam link route (`/auth/steam/link?return_url=…`).
- The sync banner appears here too while a sync runs.

### 8.8 `/wishlist`
- Summary line, rows with cover, title, price (Toman primary), **From Steam / Added by you** label, **Add to cart** (becomes "In cart"), **Remove** for your own entries only (Steam-synced ones follow your Steam wishlist). No stray discount badge when there is no discount; "—" when there is no price.
- Empty: "Nothing here yet" with search to add. An email-only person sees the Connect Steam banner.

### 8.8a Search: header box and `/search`
- Header: type 2+ letters → after a short pause up to 5 matches appear with cover, title, genre · developer and the **Toman price** ("—" when no price). Arrow keys move the highlight; Enter opens the highlighted game, or the full page when you have not used the arrows; Esc closes. The last row "See all results for …" opens `/search?q=…&library=all`. The header box hides on `/search` (the page has its own).
- `/search`: filters on the left (genre checkboxes, price from/to sliders with "No limit" at the top, library: Not in my library (default) / Already owned / Show all), sort (Best match, Price low→high, high→low, Newest), count line, card grid, **Show more** (24 per page). Everything is in the URL, so Back works and a search can be shared.
- Check: a game with no known price disappears as soon as you move a price slider (by design). Your budget ceiling is **not** applied here. Games you own carry an "In your library" tag. Nothing matching: "Nothing matches these filters" + Clear filters (keeps your text and sort).
- Phone: filters sit behind one "Filters · N" button, picked genres show as removable chips.

### 8.9 `/cart`
- Title "Cart"; "N games · checkout happens on each platform separately"; items **grouped by platform** with a **Buy on {platform}** link each.
- Price rule: when the price changed since you added the game, the **main price is the current (new) price, bold in mint, with a "Price changed" tag**, and the line beneath says "Was {old price} when you added it." Otherwise the locked price shows with "Locked in when added". The **Total** is computed from the prices shown (current price where changed).
- Remove works; empty cart: "Your cart is empty" with **Browse recommendations**. Cart only holds Steam editions.
- Known: the backend's own `total_toman` still sums the locked prices; the page does not use it.

### 8.10 `/game/[id]`
- **Hero:** the full cover in a smaller box (on the right in English, the left in Farsi) with a colour backdrop drawn from the cover; title, developer, year, up to three genres and the review score.
- **Signed out** (open it in a private window): the page still loads, with every regional price, a "sign in" prompt and **no** action buttons. Signed in: the recommendation reason banner and the actions (like, not interested, wishlist, add to cart).
- **Editions card:** one row per edition × region with Toman first and native price beneath; your region is marked, with a region note and the "prices are estimates" disclaimer.
- **More like this:** a grid of similar games (best effort; may be empty).
- A missing id (`/game/999999`) shows a friendly not-found state.

### 8.11 `/dna` (Gamer DNA)
- Needs Steam: an email-only person sees "Gamer DNA needs Steam" with a **Sign in with Steam** button that links Steam through Auth (they keep their account and games).
- A Steam-linked person before the first sync finishes sees "Reading your library…"; afterwards: **Your type** with a one-line description, total playtime, backlog count, average achievement completion, most-played studio, top genres by hours and most played games.
- The type note lists the six types: Completionist, Backlog Collector, Genre Explorer, Loyalist, Genre Specialist, Balanced. It is a light-hearted label from clear behaviour, **not** a psychological profile.

### 8.12 `/settings`: PlayNext:PC Settings and PlayNext Account
| Do | Expect |
|---|---|
| Open Settings | Two visibly separate sections: **PlayNext:PC Settings** (pricing region, default budget filter, Steam library, language) and **PlayNext Account** (Google sign-in, Steam sign-in, email, **Manage PlayNext Account**, **Sign out**). No "Your data" box (Auth owns account data). |
| Pricing region | Choose another region: saved immediately; the feed prices follow. |
| Default budget filter | The same slider as the nav chip; one stored value, two editors; mint accent. |
| Steam library | Shows PC's own sync state (separate from the Steam sign-in row). |
| Language | A select that switches English/Farsi and direction instantly; remembered in this browser only. |
| Rows in PlayNext Account | Status from Auth: Connected (check mark), Unverified, Not connected (with **Connect Google** / **Connect Steam**), or "Status unavailable right now" if Auth cannot be reached. |
| Click **Connect Google** / **Connect Steam** | Browser goes to `https://<auth>/auth/google/link?return_url=…` / `…/auth/steam/link?return_url=…`, the return URL being the encoded PC callback with `next=%2Fsettings`. After linking you return to Settings. |
| **Manage PlayNext Account** | A plain link to `https://<auth>/` (top-level navigation, never an iframe). Until Auth ships its account page it lands on Auth's login. |
| **Sign out** | DevTools → Network: a **form POST to `https://<auth>/auth/logout`** (a page navigation, not a background request). Afterwards the shared cookie is gone and PC treats you as signed out. |

### 8.13 `/auth/sso/callback` (PC-owned landing after Auth)
The CI browser test already checks these against the mock; run them by hand on staging. Open each URL while signed in:

| Open | Expect |
|---|---|
| `/auth/sso/callback?next=%2Flibrary` | Lands on `/library`. |
| `/auth/sso/callback` | Lands on `/discover` (or the next onboarding step for an unfinished profile; consent first if `consent_required`). |
| `/auth/sso/callback?next=https%3A%2F%2Fevil.example` or `?next=%2F%2Fevil.example` or `?next=%2Fauth%2Fsso%2Fcallback` | Lands on `/discover`; never leaves the site and never loops. |
| Signed out: `/auth/sso/callback?next=%2Fcart` | "We couldn't confirm your sign-in" with a **Continue to PlayNext Account** button whose URL carries `next=%2Fcart` inside the encoded callback. No automatic redirect. |
| Network tab, signed in with Steam and an out-of-date library | One `POST /api/library/sync-if-needed`; its failure never blocks the redirect. |

### 8.14 Landing page `/`
Signed out: logo, headline, one **Continue to PlayNext Account** button (the top-bar **Sign in** is the same link), the line "One PlayNext Account gives you access to all PlayNext experiences.", a visible link to the Auth site, and the feature sections (in Farsi too). Hover the button: it must be exactly `https://<auth>/login?return_url=https%3A%2F%2F<site>%2Fauth%2Fsso%2Fcallback` (no separate Steam/email buttons: Google, Steam and email are chosen on the Auth page). Signed in: you are redirected to `/discover`.

### 8.15 Language, layout and phone checks (every page)
- Toggle English ↔ Farsi in the top bar: `<html lang>` and `dir` change, the layout mirrors, prices and counts use Persian digits in Farsi. Reload: the choice is remembered (this browser only); no flash of the wrong language.
- DevTools device toolbar at ≈ 390 px: nav shows icons only, cards become a single column, no horizontal page scroll, every button at least ~36 px tall, nothing clipped.
- Genre names, regions and recommendation reasons are translated; game descriptions stay English by decision.

### 8.16 Staging test, step by step
The full end-to-end checklist (cross-subdomain cookie over HTTPS, revocation within 30 s, Auth outage = 503, global consent, provider linking, Steam sync trigger, rollback) lives in the backend repo: `docs/SETUP.md` → **15.2 Global Auth integration: step-by-step staging test**. Parts B (callback), D (sign-out) and F (Settings) are the frontend's. None of it has been run against the real Auth service yet.

---

## 9. Automated tests: what they cover and what they cannot

### 9.1 `npm test` — 50 logic tests, no browser, no backend
| File | Covers |
|---|---|
| `auth.test.ts` | sign-in is exactly `auth/login?return_url=<encoded PC callback>`; deep links ride as an encoded `next`; Steam/Google link URLs and account/logout URLs point at the Auth host; unsafe destinations (`//evil.com`, `javascript:`, backslashes, the callback itself) fall back to `/discover`; the return URL can never point at another host; callback decisions (failed / consent / onboarding / destination) |
| `flow.test.ts` | gate decision order: sign-in → consent → onboarding → ok |
| `api.test.ts` | same-origin `/api` calls, credentials, JSON bodies, query encoding, 401/429/validation error mapping, `retry_after_sec` |
| `format.test.ts` | Toman/native formatting, missing price shows "—" |
| `i18n.test.ts` | English and Farsi dictionaries have the same keys and the same `{placeholders}`; Persian digit conversion; language detection and storage; price, hours and percent text |
| `ui_logic.test.ts` | search threshold, quiz selection, counter and genre-spread rule, dismissal storage failure-safety, the four card actions |
| `discover.test.ts` | Search and Discover URL state: defaults give an empty URL and round-trip, bad values fall back, API params leave out defaults (free-only `max_price=0` is kept), filter count, genre toggle, price slider mapping |
| `feed.test.ts` | row de-duplication, cold-start rule, sync banner states, polling rule, budget slider mapping |

### 9.2 Browser tests in CI (job `e2e`)
`e2e/run.mjs` drives the production build in Chromium against `e2e/mock-backend.mjs`:
- Every page (24 entries, including signed-out, empty, email-only and not-found variants) × English and Farsi × desktop and phone. For each it checks `lang`/`dir`, horizontal overflow, unnamed controls, digit style, clipped text, touch targets under 36 px and exactly one `h1`.
- 21 named user flows: header search dropdown and Enter, search page filters (genre, library, clear, no results), phone filter panel, language toggle and reload, budget menu and slider, feed card actions and Undo, quiz counter/spread/region radio, search-and-add, library gauge, cart price rules and total, wishlist, game detail (signed in and out), Farsi translations, Settings (two sections, sign-out form POST, Auth link routes for an email-only person), the callback (safe/unsafe `next`, failed state), Gamer DNA, onboarding gauge, landing sign-in link.
- Screenshots of the main pages (English and Farsi, desktop and phone).

**Reading the result without the Actions log:** after a run, the branch `e2e-report` (do not merge or delete it) holds `e2e-report.txt` (lines `ERROR`, `WARN`, `INFO [flow: …] ok`), `e2e.log`, and `shots/*.png`. Always check that the run's commit matches the commit you pushed before trusting it:
```bash
gh run list --limit 1 --json headSha,status,conclusion
gh api "repos/playnextai/playnext-pc-frontend/contents/e2e-report.txt?ref=e2e-report" --jq .content | base64 -d
```

**Not covered by any automated test:** real backend data, real Auth, Safari/Firefox/mobile browsers, keyboard and screen-reader behaviour, performance. Section 8 is the manual substitute.

---

## 10. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `npm install` errors on versions | Ranges in `package.json` too new/old; send the message. |
| `tsc` says `Cannot find module 'next/…'` | `npm install` not run, or run in the wrong folder. |
| `node --experimental-strip-types` unknown | Node older than 22.6. |
| Page shows "Loading…" forever | The `/api` proxy is failing. `curl http://localhost:3000/api/auth/me`; check backend/mock is up and `BACKEND_URL`. |
| Everything redirects to the auth site | No/invalid session. Section 7. With a hand-made cookie: `SESSION_SECRET_KEY` differs between the signer and the backend, or the backend is in `auth` mode (a hand-made cookie is then rejected). Use the mock backend (6A) for UI work. |
| Callback shows "We couldn't confirm your sign-in" right after signing in at Auth | The browser has no `playnext_session` for this host (cookie domain not `.playnextai.com`), or the backend cannot validate it with Auth (`AUTH_BASE_URL`, outage). Check `curl -b "playnext_session=…" https://<pc>/api/auth/me` and the backend log. |
| App says to refresh / API returns 503 `auth_unavailable` | The backend cannot reach Global Auth (backend guide, section 16). It is a deliberate fail-closed answer, not a sign-out. |
| Settings "Status unavailable right now" | `/api/settings/identities` could not read Auth `/auth/identities`. |
| Stays signed in on PC after signing out elsewhere | Backend still in `legacy` mode, or less than the 30 s cache window has passed. |
| Stuck redirecting between `/consent` and elsewhere | `/auth/me` keeps saying `consent_required`; legacy mode: check `user_consents` rows for the current `PRIVACY_POLICY_VERSION`; `auth` mode: Auth's consent record. |
| Stuck at the region step | `PATCH /api/settings` failing; check the Network tab for the status/detail (e.g. `invalid_region`). |
| Feed empty | No catalog/prices/recommendations in the DB, or the person has no region. Run the backend pipelines (backend guide section 10). |
| No prices anywhere | Region not set, or no exchange rates; check `exchange_rates` and `users.region`. |
| Hero on a game page has no colour backdrop | The game has no cover image in the database (IGDB data missing). |
| Gamer DNA says "needs Steam" for a Steam person | `users.steam_id` is empty (Steam not linked at Auth), or `/api/gamer-dna` returned 403 `steam_required`. |
| Farsi shows English text somewhere | A string is hard-coded instead of coming from `lib/i18n.ts` (game descriptions are English on purpose). Add the key to both dictionaries. |
| 429 "Too many requests" message | Backend rate limiting; wait `retry_after_sec` or set `RATE_LIMIT_ENABLED=false` in the backend `.env` for local work. |
| **Manage PlayNext Account** lands on Auth's login page | Expected until Auth ships its account-management page (an Auth-side dependency). |
| Changed a `NEXT_PUBLIC_*` value, nothing changed | Restart `npm run dev` / rebuild. |
| Cookie not sent | Cookie domain/path wrong in DevTools; it must be for `localhost`, path `/`. |
| CORS errors in the console | Should not happen (same-origin proxy). It means something calls the backend URL directly instead of `/api`. |
| CI `e2e` red but `check` green | Open the `e2e-report` branch (section 9.2). A stale report from an older commit is the common trap: compare the commit. |

---

## 11. Deployment notes (preview of Phase 10)

Not a full runbook — that is Phase 10 in the backend repo's `docs/ACTION_PLAN.md` — but decisions to make:

- **Build with production values:** `NEXT_PUBLIC_SITE_URL=https://pc.playnextai.com`, `NEXT_PUBLIC_AUTH_URL=https://auth.playnextai.com`, and `BACKEND_URL` set to the backend's internal/public address **before** `npm run build`.
- **Run:** `npm run build && npm run start` (Node server, port 3000) behind a reverse proxy/TLS. Next also deploys to Vercel-style platforms; if you pick one, `BACKEND_URL` must be reachable from it.
- **Cookies:** the shared session cookie `playnext_session` (`Domain=.playnextai.com`, Secure, HttpOnly, SameSite=Lax) is set by Global Auth. It flows through the proxy untouched; do not strip `Cookie` or `Set-Cookie` in front of the app.
- **Backend `TRUSTED_PROXY_COUNT`:** with Next in front of the API, the client IP the backend sees is Next's unless forwarded headers are set correctly. Set `TRUSTED_PROXY_COUNT` to the real number of proxies, otherwise rate limiting treats all users as one. Verify with a test before launch.
- **The auth site** must allow-list `https://pc.playnextai.com` as a return host (it keeps the callback's `?next=` query string; confirmed by the Auth team, not yet tested end to end).
- **Sign-out** is a form POST to Auth, so it works only when the Auth host is reachable from the browser; Auth redirects to its own default return URL afterwards (not back to PC) until the Auth team adds a caller-provided logout return URL.
- **Who deploys and where** is an open Phase 10 decision.

---

## 12. Known unverified items and open decisions

- **Not run against the real backend or the real Auth service.** See the table at the top; Auth steps are in backend guide 15.2.
- Dependency versions are ranges; commit `package-lock.json` after the first `npm install`.
- **Privacy and Terms pages are not built** (the legal text is still to be supplied). The landing page and `/consent` do not link to them yet.
- The empty and error screens have had one pass; a final design pass is still open.
- "% match" is not shown on cards (the backend does not send it).
- The budget chip text differs slightly from the design board.
- The backend cart `total_toman` still sums locked prices; the page computes its own total from the prices shown (current price where changed).
- The onboarding heart stores a rating of 5 but cannot be un-set (the backend can set, not clear, `user_rating`), and the recommender does not use ratings yet. The playtime gauge stores a bucket the recommender uses as a weak signal.
- The quiz page is guarded by the gate, not by step order (a person can open it before choosing a region and is routed back from `/discover`).
- More recommendation reasons than the three above are not planned for now.
- No accessibility audit or keyboard-navigation pass beyond the automated checks (named controls, touch targets); no analytics or error-reporting service.
- Images are plain `<img>`; revisit `next/image` and the IGDB image domain settings.

---

## 13. Project map and how to add a page

```
app/                       routes (App Router): page.tsx per folder
  page.tsx                 landing (signed out)
  auth/sso/callback/       PC-owned landing after Global Auth
  consent/                 privacy re-accept screen
  onboarding/{region,quiz,library}/
  discover/ search/ library/ wishlist/ cart/ dna/ settings/
  game/[id]/               game detail (public)
  error.tsx not-found.tsx layout.tsx globals.css
components/
  Gate.tsx                 auth/consent/onboarding gate (wrap every signed-in page)
  AppShell.tsx             Gate + nav (budget chip, region chip, cart badge, language toggle)
  I18nProvider.tsx LangToggle.tsx   language, direction, number/price/genre/region/reason formatting
  BudgetControl.tsx        the one budget slider (nav menu and Settings)
  SearchAndAdd.tsx         shared search-and-add (library | wishlist)
  HeaderSearch.tsx         header search box + live dropdown (opens /search and /game/[id])
  ConnectSteam.tsx         card + banner that sends people to Auth's Steam link
  GameCardView.tsx FeedRow.tsx SyncBanner.tsx Playtime.tsx Thumb.tsx Empty.tsx Skeleton.tsx Icon.tsx
lib/                       pure logic, unit-tested, no React imports
  api.ts types.ts          typed client for every backend endpoint
  auth.ts flow.ts          Auth URLs + safe destinations; gate and callback decisions
  i18n.ts                  English + Farsi dictionaries and helpers
  feed.ts cards.ts quiz.ts search.ts discover.ts dismiss.ts format.ts
tests/                     node:test files for lib/ (7 files)
e2e/                       mock-backend.mjs + run.mjs (Playwright, run by CI)
.github/workflows/ci.yml   job `check` (typecheck, test, build) and job `e2e`
public/brand/              logos
next.config.mjs            /api -> BACKEND_URL rewrite
```

**To add a page:** (1) confirm the endpoint in the backend repo's `docs/API_CONTRACT.md` and that `lib/api.ts` has a typed function for it (add one, with its type in `lib/types.ts`, if not); (2) put decisions that can be pure (filtering, ordering, labels) in `lib/` with a test; (3) add every visible string to **both** dictionaries in `lib/i18n.ts`; (4) create `app/<route>/page.tsx` as a `"use client"` component wrapped in `<AppShell>` (or `<Gate>` for onboarding-like screens); (5) handle loading, empty, error and 429 states, and use logical CSS properties so it works right-to-left; (6) add mock data for it in `e2e/mock-backend.mjs`, an entry in `PAGES` (and a flow if it has behaviour) in `e2e/run.mjs`; (7) run `npm run typecheck && npm test && npm run build`; (8) add a subsection to section 8 of this guide.
