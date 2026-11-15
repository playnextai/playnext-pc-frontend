# PlayNext:PC frontend (pc.playnextai.com)

Next.js 15 (App Router) + React 19 + TypeScript. A separate repository from the Python backend
(`playnextai/playnext-pc-backend`). Bilingual: English (LTR) and Farsi (RTL, Persian digits).

**Start here:** `FRONTEND_SETUP_AND_TEST_GUIDE.md` — install, run (with a mock backend or the real one),
page-by-page manual tests, CI, troubleshooting.

## Rules this repo follows
- **No sign-in here; Global Auth owns identity.** Sign-in is a redirect to
  `https://auth.playnextai.com/login?return_url=<PC callback>`. The PC callback `/auth/sso/callback` asks the backend who the
  session belongs to (the backend validates it with Auth), then applies consent -> PC onboarding -> a validated destination
  (`/discover` by default). Linking Steam/Google goes to Auth's `/auth/steam/link` and `/auth/google/link`; sign-out is a
  top-level form POST to the same-origin `/api/auth/logout?return_url=<encoded PC cleanup callback>`; the PC backend validates the PC Origin, invalidates its cache, sends a server-to-server POST to Auth with the original Origin and shared cookie, and relays Auth's 303 and Set-Cookie response. Auth revokes the global session and returns the browser to PC. Account management is a link to `https://auth.playnextai.com/`.
  `lib/auth.ts` is the only file that knows these URLs. Contract: "PlayNext:PC - Global Auth Integration Hand-off" v1.0 (see the
  backend repo's `GLOBAL_AUTH_INTEGRATION.md`). The shared architecture standard for PC, Boardgames, Plays (Events), and future ventures is the [Global Auth Venture Integration Contract](https://github.com/playnextai/playnext-global-auth/blob/b3/5-final-review-hardening/docs/VENTURE_INTEGRATION_CONTRACT.md).
- Settings shows two separate areas: **PlayNext:PC Settings** (owned here) and **PlayNext Account** (owned by Auth).
- The browser talks only to same-origin `/api/*`; `next.config.mjs` forwards that to the backend (`BACKEND_URL`). The client never
  sends a user id.
- Every signed-in page is wrapped in `components/Gate.tsx`: signed out -> Auth; `consent_required` -> `/consent`; onboarding
  incomplete -> the next step (`GET /onboarding/status`).
- Endpoint shapes: the backend repo's `PHASE_9_CONTRACT.md`, mirrored in `lib/types.ts` / `lib/api.ts`.
- Prices: Toman primary, native regional price secondary; a missing price shows "—", never 0.
- Every visible string is in `lib/i18n.ts` in English and Farsi (checked by the type system and `tests/i18n.test.ts`).

## Setup
```bash
cp .env.example .env.local
npm install
npm run dev            # http://localhost:3000
npm test               # 43 pure-logic tests (Node >= 22.6)
npm run typecheck
npm run build
```
UI work with no backend: `node e2e/mock-backend.mjs` (port 8000) and `npm run dev`; switch scenarios at
`http://localhost:8000/__scenario/full|empty|out|consent`.

## Local-development catch
Auth only returns people to allow-listed hosts (`*.playnextai.com`), so real sign-in cannot return to
`http://localhost:3000`. Use the mock backend, or (legacy backend mode only) a hand-made session cookie; see guide section 7.

## Status (honest)
- **Built:** every page on the approved design board: landing, `/auth/sso/callback`, `/consent`, onboarding (region, taste quiz,
  library), feed `/discover`, `/library`, `/wishlist`, `/cart`, `/game/[id]` (public), `/dna`, `/settings`, 404/error pages.
- **Verified on every push (GitHub Actions `frontend-ci`):** typecheck, 43 tests, production build, and a real Chromium run
  against a mock backend (every page x English/Farsi x desktop/phone, 18 named flows, screenshots). Results are readable on the
  `e2e-report` branch (do not merge or delete it).
- **Not verified:** the real backend (Postgres, Steam, Redis, Celery, IGDB, Bonbast), the real Global Auth service
  (cross-subdomain cookie over HTTPS, `/auth/me`, `/auth/identities`, central logout), browsers other than Chromium,
  accessibility beyond automated checks.
- **Open:** Privacy and Terms pages (legal text needed), final pass on empty/error screens, optional "% match" on cards, Auth's
  account-management page (Auth team; "Manage PlayNext Account" lands on Auth's login until it exists).
- **Known limits:** the onboarding heart sets a rating of 5 but cannot be un-set and the recommender does not use ratings; the
  quiz page is guarded by the gate, not by step order.
