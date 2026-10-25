// Sign-in is NOT implemented in this app. Every sign-in request is sent to the
// shared auth site (auth.playnextai.com), which sends the person back to the
// return_url once the session cookie is set. See playnext/SSO_HANDOFF_PC_IMPLEMENTATION.md.

// PROVISIONAL CONTRACT (SSO team, 2026-10-24): a shared `/login` entry point that accepts a
// validated `return_url` is their TARGET; it is not confirmed to exist yet, and the Steam path
// is unconfirmed too. Their public routes will be finalized in the platform contract. Until
// then the paths live ONLY here and are overridable by env, so adopting the final contract is a
// one-file change. Do not add another redirect convention anywhere else in this app.
export const AUTH_LOGIN_PATH = process.env.NEXT_PUBLIC_AUTH_LOGIN_PATH ?? "/login";
export const AUTH_STEAM_PATH = process.env.NEXT_PUBLIC_AUTH_STEAM_PATH ?? "/steam/login";

export const AUTH_URL = (process.env.NEXT_PUBLIC_AUTH_URL ?? "https://auth.playnextai.com").replace(/\/+$/, "");
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://pc.playnextai.com").replace(/\/+$/, "");

/** A same-site path we are willing to return to: starts with a single "/",
 *  no scheme, no protocol-relative "//", no backslashes. */
export function isSafeReturnPath(path: string | null | undefined): path is string {
  if (!path || typeof path !== "string") return false;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
  return !/[\u0000-\u001f]/.test(path);
}

/** Absolute URL on THIS site to come back to after sign-in. Unsafe input falls back to /discover. */
export function buildReturnUrl(path: string | null | undefined, siteUrl: string = SITE_URL): string {
  return siteUrl.replace(/\/+$/, "") + (isSafeReturnPath(path) ? path : "/discover");
}

/** Where to send someone who needs to sign in (or switch to a signed-in session). */
export function signInUrl(returnPath?: string | null, opts: { authUrl?: string; siteUrl?: string } = {}): string {
  const auth = (opts.authUrl ?? AUTH_URL).replace(/\/+$/, "");
  const ret = buildReturnUrl(returnPath, opts.siteUrl ?? SITE_URL);
  return `${auth}${AUTH_LOGIN_PATH}?return_url=${encodeURIComponent(ret)}`;
}

/** Steam sign-in goes through the same auth site. */
export function steamSignInUrl(returnPath?: string | null, opts: { authUrl?: string; siteUrl?: string } = {}): string {
  const auth = (opts.authUrl ?? AUTH_URL).replace(/\/+$/, "");
  const ret = buildReturnUrl(returnPath, opts.siteUrl ?? SITE_URL);
  return `${auth}${AUTH_STEAM_PATH}?return_url=${encodeURIComponent(ret)}`;
}
