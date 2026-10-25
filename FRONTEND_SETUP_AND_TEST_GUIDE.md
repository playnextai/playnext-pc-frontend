# PlayNext:PC Frontend — Complete Setup, Compile and Test Guide

**Audience:** you (or a new developer) with the `playnext-web` folder and nothing else set up. **Goal:** compile it, run it against the backend, and prove each screen works.

**CI status (2026-10-25).** GitHub Actions (`.github/workflows/ci.yml`) ran `npm install`, `npm run typecheck`, `npm test` (29 pass) and `npm run build` on a clean machine, and all passed on the first run. So the code **does compile and build**. It has still **never been opened in a browser**: every manual check in section 8 is unverified, and the section 5 error tables below are precautionary.

**Honesty note, read first.** This frontend was written in a sandbox that could not reach the npm registry. What was actually executed there: **29 automated logic tests** (Node's built-in runner) and a TypeScript check of the plain-TypeScript files in `lib/`. What has **never** been run: `npm install`, `next build`, a TypeScript check of any React/Next file (`app/`, `components/`), the dev server, or any page in a browser. So the very first thing to do is the compile step in section 5, and **expect a few type errors and small runtime bugs** — that is normal for code that has never met a compiler. Send the exact messages back and they get fixed in one pass.

Companion document for the backend: `playnext/COMPLETE_SETUP_AND_TEST_GUIDE.md`. Endpoint shapes: `playnext/PHASE_9_CONTRACT.md`.

---

## Contents

1. What this app is (and is not)
2. Prerequisites
3. Install
4. Configuration (environment variables)
5. Compile: typecheck, tests, build — and what to do with errors
6. Run it locally against the backend
7. Getting a signed-in session on localhost (sign-in cannot return to localhost)
8. Manual test script, page by page
9. Automated tests: what they cover and what they cannot
10. Troubleshooting
11. Deployment notes (preview of Phase 10)
12. Known unverified items and open decisions
13. Project map and how to add a page

---

## 1. What this app is (and is not)

PlayNext:PC's web frontend: Next.js (App Router) + React + TypeScript, served at `pc.playnextai.com`. It is a **separate repository** from the Python backend.

**Rules it follows (do not break them when adding code):**

| Rule | Why | Where |
|---|---|---|
| **No sign-in UI here.** Every sign-in request is a redirect to the auth site (`auth.playnextai.com`) with a `return_url` on this site. | Decision 2026-10-24: sign-in belongs to the platform. The auth site's final URLs are **provisional** until the SSO team publishes their contract. | `lib/auth.ts` is the only file that knows the paths |
| The browser only calls **same-origin `/api/*`**, which Next forwards to the backend. | No CORS, and the session cookie flows through untouched. | `next.config.mjs` |
| The client **never sends a user id**. | The backend takes it from the signed session cookie. | `lib/api.ts` |
| Every signed-in page is wrapped in the **gate**: signed out → auth site; consent needed → `/consent`; onboarding unfinished → the next step. | Onboarding is tracked by the backend (`GET /onboarding/status`), never guessed from "new account". | `components/Gate.tsx`, `lib/flow.ts` |
| **Toman is the primary price**, the native regional price is secondary; a missing price shows "—", never 0. | Product decision. | `lib/format.ts` |

**Request path:** `Browser → /api/foo (this site) → Next rewrite → BACKEND_URL/foo (FastAPI)`.

**What exists today:** landing page, consent screen, onboarding (region, taste quiz, library entry), the feed (five de-duplicated rows, cold-start fallback, sync banner), the navigation shell (Library, Wishlist, Cart with badge, budget chip, region chip, avatar), shared components (search-and-add, Connect Steam prompt, four-action game card).
**Not built yet:** game detail, Library, Wishlist, Cart, Settings, Gamer DNA pages (the nav links to them already — they will 404 until built).

---

## 2. Prerequisites

- **Node.js 22.6 or newer** (the current LTS is fine). Check: `node -v`. The test command uses Node's built-in TypeScript stripping, which needs ≥ 22.6.
- **npm** (comes with Node). Check: `npm -v`.
- **The backend** running if you want to see real data (section 6). Compiling and running the unit tests need no backend at all.
- A modern browser (Chrome, Edge or Firefox).
- Internet access for `npm install`.

---

## 3. Install

1. Unzip `playnext_web.zip` somewhere without spaces in the path. The folder containing `package.json` is **the project root**; run every command from there.
2. Create your local env file:
   - macOS/Linux: `cp .env.example .env.local`
   - Windows PowerShell: `copy .env.example .env.local`
3. Install dependencies: `npm install`
   - Creates `node_modules/` and `package-lock.json`. **Commit `package-lock.json`** — it pins exact versions; `package.json` only has ranges (`^15`, `^19`, `^5.6`).
   - If it fails with a version-resolution error, send the message. The ranges may need adjusting to what is current.
4. Never commit `.env.local` or `node_modules/` (`.gitignore` already excludes them).

---

## 4. Configuration (environment variables)

Edit `.env.local`:

| Variable | Default | Meaning | When it is read |
|---|---|---|---|
| `BACKEND_URL` | `http://localhost:8000` | Where `/api/*` is forwarded (the FastAPI server). Server-side only. | **At build time and server start** (rewrites are fixed when the build runs) |
| `NEXT_PUBLIC_SITE_URL` | `https://pc.playnextai.com` | This site's public origin. Used to build the `return_url` sent to the auth site. | **Baked into the JavaScript at build time** |
| `NEXT_PUBLIC_AUTH_URL` | `https://auth.playnextai.com` | The shared sign-in site. | Baked at build time |
| `NEXT_PUBLIC_AUTH_LOGIN_PATH` | `/login` | **Provisional** path of the auth site's login page. | Baked at build time |
| `NEXT_PUBLIC_AUTH_STEAM_PATH` | `/steam/login` | **Provisional** path of the auth site's Steam entry. | Baked at build time |

Important gotchas:
- Anything starting with `NEXT_PUBLIC_` is compiled into the browser code. **Changing it requires a rebuild** (`npm run build`), or a restart of `npm run dev`.
- Never put secrets in a `NEXT_PUBLIC_*` variable. This app needs no secrets at all.
- For local work set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

---

## 5. Compile: typecheck, tests, build

Run these three, in this order, from the project root.

### 5.1 `npm run typecheck`
Runs `tsc --noEmit` over everything against the real React/Next types. **This is the check that matters most right now** because the React code has never been compiled.

- If it complains that `next-env.d.ts` is missing: run `npm run dev` once (or `npm run build`); Next generates it. Then re-run typecheck.
- **Send me the complete output** if there are errors. Typical first-run findings in code like this: a missing or loose type on an event handler, an import path alias (`@/…` is defined in `tsconfig.json`), `Link`/`useRouter` typing, or a stricter-than-expected null check.
- Expected end state: no output and exit code 0.

### 5.2 `npm test`
Runs the six test files in `tests/` with Node's built-in runner. Expected: `# pass 29`, `# fail 0`. (This one already passes in the sandbox; if it fails for you it is an environment issue — check `node -v` ≥ 22.6.)

### 5.3 `npm run build`
Production build. It type-checks again, compiles every route, and reports pages and sizes. Next-specific problems appear here and not in plain `tsc`:

| Message | Meaning / fix |
|---|---|
| `useSearchParams() should be wrapped in a suspense boundary` | A page uses it without `<Suspense>`. Wrap that component (send me the page name). |
| `You're importing a component that needs useState/useEffect… add "use client"` | A component is missing the `"use client"` first line. |
| `Module not found: Can't resolve '@/…'` | The `paths` alias in `tsconfig.json` is not being picked up; check you run from the project root. |
| Warnings about `<img>` | `next/image` is recommended; images are plain `<img>` on purpose for now (cover URLs come from IGDB). Safe to ignore. |

Expected end state: a table of routes ending without errors. Routes today: `/`, `/consent`, `/discover`, `/onboarding/region`, `/onboarding/quiz`, `/onboarding/library`.

---

## 6. Run it locally against the backend

1. **Start the backend first** (separate terminals), following `playnext/COMPLETE_SETUP_AND_TEST_GUIDE.md` sections 4–9: Postgres, Redis, `uvicorn main:app --reload --port 8000`, and for the sync banner also the Celery worker. Load some data (catalog, exchange rates, prices) per its section 10, otherwise the feed is empty.
2. Check the backend answers: `curl http://localhost:8000/auth/me` → `{"authenticated":false}`.
3. In `.env.local` set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` and confirm `BACKEND_URL=http://localhost:8000`.
4. Start the frontend: `npm run dev` → open **http://localhost:3000**.
5. Check the proxy works from a terminal: `curl http://localhost:3000/api/auth/me` → the same JSON as step 2. If this fails, the rewrite or `BACKEND_URL` is wrong.

What you will see: the landing page. Because no session exists, any signed-in page redirects to the auth site. On localhost that sign-in **cannot bring you back** (the auth site only returns people to `*.playnextai.com`) — see section 7.

---

## 7. Getting a signed-in session on localhost

Real sign-in cannot return to `http://localhost:3000`. For development only, create a test person and a session cookie by hand. **Never do this on a production database or share the cookie.**

1. **Create a test user** in the dev database (replace the email):
   ```sql
   INSERT INTO users (email, display_name) VALUES ('dev@example.com', 'Dev') RETURNING id;
   ```
   Note the `id` (say `1`). To also simulate consent: run the sign-in consent insert, or simply sign in once through the backend's email flow (backend guide 12.1) which records consent properly. Otherwise `/auth/me` will report `consent_required: true` and the app sends you to `/consent` — which is itself a good thing to test (section 8.2).
2. **Make a signed cookie value** with the backend's own signer, from the **backend** project root with its virtualenv active and the **same `SESSION_SECRET_KEY` as the running backend**:
   ```bash
   python -c "import dependencies as d; print(d.sign({'v': 1, 'user_id': 1}))"
   ```
3. **Put it in your browser:** open http://localhost:3000, DevTools → Application (Chrome/Edge) or Storage (Firefox) → Cookies → `http://localhost:3000` → add a cookie: Name `playnext_session`, Value = the printed string, Path `/`. Leave Secure off.
4. Reload. `http://localhost:3000/api/auth/me` should now show `authenticated: true`, and the gate lets you in.
5. Other ways: ask the SSO team to allow a dev host, or add a hosts-file alias on a `*.playnextai.com` name that they allow.

The cookie lasts 30 days. Delete it in DevTools (or `POST /api/auth/logout`) to test the signed-out path.

---

## 8. Manual test script, page by page

Prerequisites for these checks: backend + worker running, some data loaded, section 7 done. Use `psql` to confirm what the backend recorded. `.env.local` must have `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

### 8.1 The gate (every signed-in page)
| Do | Expect |
|---|---|
| Delete the cookie, open `/discover` | Browser goes to `…/login?return_url=http%3A%2F%2Flocalhost%3A3000%2Fdiscover` on the auth host (the page itself may 404 — the URL is the test). |
| Cookie present, consent given, onboarding done | `/discover` renders. |
| New user (no region) opens `/discover` | Redirected to `/onboarding/region`. |
| Open `/onboarding/quiz` directly before choosing a region | The page renders (known limit), but on `/discover` you are sent back to the region step. |

### 8.2 `/consent`
Bump `PRIVACY_POLICY_VERSION` in the backend `.env` and restart it. Reload the app → redirected to `/consent`. The button stays disabled until the box is ticked; **Continue** calls `POST /auth/consent` and returns to the app. DB check: a new row in `user_consents` for the new version.

### 8.3 `/onboarding/region`
A dropdown of friendly names (Turkey, not `TR`). **Continue** is disabled until chosen. After saving: `SELECT region FROM users WHERE id=1;` shows the code, and you are sent to the next step (the quiz).

### 8.4 `/onboarding/quiz`
- A grid of games with covers; tapping highlights (cyan outline); the bottom bar counter reads "Tap the games you like" → "1 game picked" → "N games picked".
- **Let's go** works with zero picks. **Skip** also continues.
- DB check after submit: `SELECT * FROM user_games WHERE source='quiz_seed';` has your picks; `SELECT quiz_done_at FROM pc_user_state;` is set (also after Skip).

### 8.5 `/onboarding/library`
- Search needs 2+ characters; results appear after a short pause; a game already added shows "Added" and cannot be added twice.
- Search for nonsense → the "we'll still learn from what you add" message in the dropdown.
- Add a game → it appears in the list; ♥ saves a rating (`user_games.user_rating = 5`; it cannot be un-hearted — known limit); **Remove** deletes the manual row.
- Steam-linked person sees different intro copy.
- **Done/Continue/Skip for now** → `pc_user_state.library_done_at` set → `/discover`.

### 8.6 `/discover` (the feed)
- Rows in order: *Picked for you*, *What to play next*, *Still in your library*, *Good deals for you*, *Out of the usual*. Empty rows do not appear; **a game never shows twice**.
- **Cold start** (new person, no data): *Popular right now* plus the two buttons back to the quiz and manual add.
- Price on each card: Toman large, native price beneath; "—" when unknown; a green `-NN%` when discounted.
- Card actions (hover/aria labels): ♥ like (turns green), ✕ not interested and ✓ already own (card disappears; DB: `feedback` row, and "already own" also adds a library row), ★ wishlist (turns green; DB: `user_wishlist` row, `source='manual'`). Errors show "Couldn't save that." inline.
- **Budget dropdown** in the nav: choose "Up to 500,000 Toman" → rows reload and expensive games disappear; `users.budget_ceiling_toman` is updated. It is the same value Settings will edit.
- **Cart badge** shows the number of items in the cart (0 hides it).
- **Sync banner:** right after a real Steam sign-in a blue "Syncing your Steam library…" bar appears and clears itself when the worker finishes, then the feed reloads. To fake it: set Redis key `lsync:1` to `{"status":"running","at":<now epoch>}` (`redis-cli SET lsync:1 '{"status":"running","at":1790000000}'` with a current timestamp); it turns into "couldn't sync" if older than 30 minutes.

### 8.7 Mobile layout
In DevTools toggle the device toolbar (≈ 390 px wide): the nav shows icons only (no labels), cards become a single column, the quiz bottom bar stays usable. Check landscape and a narrow 320 px width too.

### 8.8 Landing page `/`
Signed out: logo, headline, **Sign in with Steam** and **Use email instead** (both are links to the auth site — hover to read the URL; they will not work until the SSO team publishes the real addresses). Signed in: you are redirected to `/discover`.

---

## 9. Automated tests: what they cover and what they cannot

`npm test` — 29 tests, no browser, no backend:

| File | Covers |
|---|---|
| `auth.test.ts` | sign-in URLs always target the auth site; `return_url` always on this site; unsafe paths (`//evil.com`, `javascript:`, backslashes) fall back; Steam path |
| `flow.test.ts` | gate decision order: sign-in → consent → onboarding → ok |
| `api.test.ts` | same-origin `/api` calls, credentials, JSON bodies, query encoding, 401/429/validation error mapping, `retry_after_sec` |
| `format.test.ts` | Toman/native formatting, missing price shows "—" |
| `ui_logic.test.ts` | search threshold, quiz selection and counter, dismissal storage failure-safety, the four card actions |
| `feed.test.ts` | row de-duplication, cold-start rule, sync banner states, polling rule |

**Not covered by any automated test:** anything that renders — components, pages, styling, mobile layout, the router redirects, real network calls, accessibility. Section 8 is the manual substitute. When time allows, the next investment is Playwright browser tests against a seeded backend (the sandbox has Playwright available, but the app has never been run, so tests would currently only find bugs by failing).

---

## 10. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `npm install` errors on versions | Ranges in `package.json` too new/old; send the message. |
| `tsc` says `Cannot find module 'next/…'` | `npm install` not run, or run in the wrong folder. |
| `node --experimental-strip-types` unknown | Node older than 22.6. |
| Page shows "Loading…" forever | The `/api` proxy is failing. `curl http://localhost:3000/api/auth/me`; check backend is up and `BACKEND_URL`. |
| Everything redirects to the auth site | No/invalid session. Section 7. If you used a hand-made cookie: `SESSION_SECRET_KEY` differs between the signer and the backend. |
| Stuck redirecting between `/consent` and elsewhere | `/auth/me` keeps saying `consent_required`; check `user_consents` rows for the current `PRIVACY_POLICY_VERSION`. |
| Stuck at the region step | `PATCH /api/settings` failing; check the Network tab for the status/detail (e.g. `invalid_region`). |
| Feed empty | No catalog/prices/recommendations in the DB, or the person has no region. Run the backend pipelines (backend guide section 10). |
| No prices anywhere | Region not set, or no exchange rates; check `exchange_rates` and `users.region`. |
| 429 "Too many requests" message | Backend rate limiting; wait `retry_after_sec` or set `RATE_LIMIT_ENABLED=false` in the backend `.env` for local work. |
| Sign-in links go to a 404 | Expected: the auth site's final URLs are not published yet. |
| Changed a `NEXT_PUBLIC_*` value, nothing changed | Restart `npm run dev` / rebuild. |
| Cookie not sent | Cookie domain/path wrong in DevTools; it must be for `localhost`, path `/`. |
| CORS errors in the console | Should not happen (same-origin proxy). It means something calls the backend URL directly instead of `/api`. |

---

## 11. Deployment notes (preview of Phase 10)

Not a full runbook — that is Phase 10 in `playnext/ACTION_PLAN.md` — but decisions to make:

- **Build with production values:** `NEXT_PUBLIC_SITE_URL=https://pc.playnextai.com`, `NEXT_PUBLIC_AUTH_URL=https://auth.playnextai.com`, and `BACKEND_URL` set to the backend's internal/public address **before** `npm run build`.
- **Run:** `npm run build && npm run start` (Node server, port 3000) behind a reverse proxy/TLS. Next also deploys to Vercel-style platforms; if you pick one, `BACKEND_URL` must be reachable from it.
- **Cookies:** the session cookie is set by the backend (`Domain=.playnextai.com`, `Secure`). It flows through the proxy untouched; do not strip `Set-Cookie` in front of the app.
- **Backend `TRUSTED_PROXY_COUNT`:** with Next in front of the API, the client IP the backend sees is Next's unless forwarded headers are set correctly. Set `TRUSTED_PROXY_COUNT` to the real number of proxies (Next counts as one if it forwards `X-Forwarded-For`), otherwise rate limiting treats all users as one. Verify with a test before launch.
- **The auth site** must allow-list `https://pc.playnextai.com` as a return host.
- **Who deploys and where** is an open Phase 10 decision.

---

## 12. Known unverified items and open decisions

- Never compiled/run: all of `app/` and `components/` (section 5 is the first check).
- Dependency versions are ranges with no lockfile until you run `npm install`.
- **Auth redirect URLs are provisional** (`/login`, `/steam/login`, parameter `return_url`) until the SSO team's platform contract; one-file change in `lib/auth.ts`. The backend's own `/signin?error=…` and `/private-profile-gate` redirects are not rendered by this app — the auth site is expected to own those screens (to be confirmed).
- Budget presets (100k–2M Toman) are placeholders; product to confirm.
- The onboarding ♥ rating is stored but unused by the recommender and cannot be un-set.
- Nav links to `/library`, `/wishlist`, `/cart`, `/settings` (and card clicks to game detail) lead to pages not built yet.
- No accessibility audit, no keyboard-navigation pass, no right-to-left (Persian) layout work, no analytics, no error reporting service.
- Images are plain `<img>`; revisit `next/image` and the IGDB image domain settings.

---

## 13. Project map and how to add a page

```
app/                       routes (App Router): page.tsx per folder
  page.tsx                 landing (signed out)
  consent/                 privacy re-accept screen
  onboarding/{region,quiz,library}/
  discover/                the feed
  layout.tsx, globals.css  shell + design tokens (colours from the logo)
components/
  Gate.tsx                 auth/consent/onboarding gate (wrap every signed-in page)
  AppShell.tsx             Gate + nav (budget chip, region chip, cart badge)
  SearchAndAdd.tsx         shared search-and-add (library | wishlist)
  ConnectSteam.tsx         card + dismissible banner
  GameCardView.tsx         feed card with the four actions
  FeedRow.tsx, SyncBanner.tsx
lib/                       pure logic, unit-tested, no React imports
  api.ts types.ts          typed client for every backend endpoint
  auth.ts flow.ts          sign-in URLs, gate decision
  feed.ts cards.ts quiz.ts search.ts dismiss.ts format.ts
tests/                     node:test files for lib/
public/brand/              logos
next.config.mjs            /api -> BACKEND_URL rewrite
```

**To add a page:** (1) confirm the endpoint in `playnext/PHASE_9_CONTRACT.md` and that `lib/api.ts` has a typed function for it (add one, with its type in `lib/types.ts`, if not); (2) put decisions that can be pure (filtering, ordering, labels) in `lib/` with a test; (3) create `app/<route>/page.tsx` as a `"use client"` component wrapped in `<AppShell>` (or `<Gate>` for onboarding-like screens); (4) handle loading, empty, error and 429 states; (5) run `npm run typecheck && npm test && npm run build`; (6) add a line to section 8 of this guide.
