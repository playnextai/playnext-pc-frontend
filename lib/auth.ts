// Sign-in and account linking belong to Global Auth (auth.playnextai.com).
// PC sign-out uses a same-origin relay; Global Auth remains the authority that revokes the shared session.
// Contract: "PlayNext:PC - Global Auth Integration Hand-off" v1.0 (Auth B2 0.3.0).
//
// PC owns only: the callback page (/auth/sso/callback), PC onboarding and PC settings.
// PC never writes provider identities and never trusts a user id from the browser; identity comes from
// the session cookie, which the PC backend validates against Auth /auth/me.

export const AUTH_URL = (process.env.NEXT_PUBLIC_AUTH_URL ?? "https://auth.playnextai.com").replace(/\/+$/, "");
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://pc.playnextai.com").replace(/\/+$/, "");

export const CALLBACK_PATH = "/auth/sso/callback";
export const DEFAULT_DESTINATION = "/discover";

type Opts = { authUrl?: string; siteUrl?: string; logoutReturnPath?: string };
const trim = (s: string) => s.replace(/\/+$/, "");

/** A same-site path we are willing to return to: starts with a single "/",
 *  no scheme, no protocol-relative "//", no backslashes, no control characters. */
export function isSafeReturnPath(path: string | null | undefined): path is string {
  if (!path || typeof path !== "string") return false;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
  return !/[\u0000-\u001f]/.test(path);
}

/** The destination to use after the callback: the safe requested path, else /discover.
 *  The callback itself is never a valid destination (it would loop). */
export function safeDestination(path: string | null | undefined): string {
  if (!isSafeReturnPath(path)) return DEFAULT_DESTINATION;
  if (path === CALLBACK_PATH || path.startsWith(CALLBACK_PATH + "?") || path.startsWith(CALLBACK_PATH + "/")) return DEFAULT_DESTINATION;
  return path;
}

/** The PC-owned callback Auth sends people back to. `next` (validated, optional) is the page they
 *  originally wanted; the default destination is omitted so the common URL is exactly the bare callback. */
export function callbackUrl(next?: string | null, siteUrl: string = SITE_URL): string {
  const base = trim(siteUrl) + CALLBACK_PATH;
  const dest = safeDestination(next);
  return dest === DEFAULT_DESTINATION ? base : `${base}?next=${encodeURIComponent(dest)}`;
}

/** Central sign-in / create account. Google, Steam and email are chosen on the Auth page. */
export function signInUrl(next?: string | null, opts: Opts = {}): string {
  return `${trim(opts.authUrl ?? AUTH_URL)}/login?return_url=${encodeURIComponent(callbackUrl(next, opts.siteUrl))}`;
}

/** Connect Steam as a PlayNext sign-in method (needs an existing session). Not a library sync. */
export function steamLinkUrl(next?: string | null, opts: Opts = {}): string {
  return `${trim(opts.authUrl ?? AUTH_URL)}/auth/steam/link?return_url=${encodeURIComponent(callbackUrl(next, opts.siteUrl))}`;
}

/** Connect Google as a PlayNext sign-in method (needs an existing session). */
export function googleLinkUrl(next?: string | null, opts: Opts = {}): string {
  return `${trim(opts.authUrl ?? AUTH_URL)}/auth/google/link?return_url=${encodeURIComponent(callbackUrl(next, opts.siteUrl))}`;
}

/** Account-management entry point (Auth owns the page). Plain top-level navigation, never an iframe. */
export function accountUrl(opts: Opts = {}): string {
  return `${trim(opts.authUrl ?? AUTH_URL)}/`;
}

/** PC-specific top-level form POST to the same-origin backend relay. The relay
 *  calls Auth server-to-server, forwarding the browser Origin and session cookie,
 *  then relays Auth's cookie clearing and post-logout redirect. Other ventures
 *  should implement the shared Venture Integration Contract, not reuse this PC route. */
export function logoutUrl(opts: Opts = {}): string {
  // PC uses a post-logout cleanup callback for pre-SSO host-only cookies.
  // Other ventures can use their own callback or keep the default public root.
  const returnPath = isSafeReturnPath(opts.logoutReturnPath) ? opts.logoutReturnPath : "/";
  const returnUrl = `${trim(opts.siteUrl ?? SITE_URL)}${returnPath}`;
  return `/api/auth/logout?return_url=${encodeURIComponent(returnUrl)}`;
}
