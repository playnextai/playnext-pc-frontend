# playnext-web — PlayNext:PC frontend (pc.playnextai.com)

Next.js (App Router, TypeScript). Separate repo from the Python backend (`playnext/`).

## Rules this repo follows
- **No sign-in here.** (Contract status: PROVISIONAL. The SSO team confirmed a shared `/login?return_url=` is their *target*, not something that exists yet; `lib/auth.ts` is the only place the paths live, so adopting their final contract is a one-file change. Don't add another redirect convention.) Every sign-in request is a redirect to `https://auth.playnextai.com/login?return_url=<absolute URL on this site>` (Steam: `/steam/login`). See `lib/auth.ts`. `return_url` is always built on this site's own origin from a validated path; the auth site must also allowlist it.
- The browser talks only to same-origin `/api/*`; `next.config.mjs` forwards that to the backend (`BACKEND_URL`). Identity always comes from the session cookie; the client never sends a user id.
- Every signed-in page is wrapped in `components/Gate.tsx`: signed out -> auth site; `consent_required` -> `/consent`; onboarding incomplete -> the next step (`GET /onboarding/status`, never "is this a new account").
- Endpoint shapes: `../playnext/PHASE_9_CONTRACT.md`, mirrored in `lib/types.ts` / `lib/api.ts`.
- Prices: Toman primary, native regional price secondary (`lib/format.ts`). Missing price shows "—", never 0.

## Setup
```bash
cp .env.example .env.local
npm install
npm run dev            # http://localhost:3000, backend must run on BACKEND_URL
npm test               # pure-logic tests (node's built-in runner, Node >= 22.6)
npm run typecheck
npm run build
```

## Local-development catch
The auth site only returns people to allow-listed hosts (`*.playnextai.com`), so after signing in
on auth.playnextai.com you cannot be sent back to `http://localhost:3000`. Options: (a) ask the SSO
team to allow a dev host, (b) add a hosts-file alias such as `pc.dev.playnextai.com` -> 127.0.0.1 if
they allow it, or (c) for UI work, sign in on the deployed site, copy the `playnext_session` cookie
value into your dev browser for `localhost` (it only works if backend `SESSION_SECRET_KEY` matches).

## Status (honest)
- Verified: `lib/` type-checks and its 29 tests pass (Node 22).
- NOT verified: nothing in `app/` or `components/` has been compiled or run - the build sandbox could not
  reach the npm registry, so `next build` and `tsc` against React/Next types have never run. Expect to fix
  small type errors on first `npm run typecheck`. Dependency versions are caret ranges (`^15`, `^19`), unlocked.
- Built: landing, `/consent`, the three onboarding steps (`/onboarding/region`, `/onboarding/quiz`, `/onboarding/library`), a skeleton `/discover` using the shared game card, the typed API client, the gate; shared components `SearchAndAdd`, `ConnectSteam` (card + dismissible banner), `GameCardView` (4 actions).
- Built (unverified React): `AppShell` nav (Library, Wishlist, Cart badge, budget chip, region chip, avatar; icon-only on mobile), the real feed (5 deduplicated rows, sync banner with polling, cold-start fallback with buttons to the quiz and manual add).
- To build:
  `/game/[id]` (intercepting modal), `/library`, `/wishlist`, `/cart`, `/gamer-dna`, `/settings`.
- Known limits: the onboarding heart sets a rating of 5 but cannot be un-set (backend can set, not clear, `user_rating`), and the recommender does not use ratings yet; the quiz page is only reachable-guarded by the gate, not by step order (a person can open it before choosing a region, and will be routed back from `/discover`).
