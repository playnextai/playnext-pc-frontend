import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/auth";

export const dynamic = "force-dynamic";

const LEGACY_HOST_ONLY_COOKIES = [
  "playnext_session",
  "playnext_pending_steam",
] as const;

/**
 * Auth redirects here only after revoking the server-side session and clearing
 * the shared .playnextai.com cookie. This route removes pre-SSO cookies that
 * were scoped only to pc.playnextai.com; it must never delete the parent-domain
 * cookie because Auth has already handled that authority.
 */
export function GET() {
  // Use the configured venture origin, not the incoming Host header, for the redirect.
  const response = NextResponse.redirect(new URL("/", SITE_URL), 303);
  const secure = new URL(SITE_URL).protocol === "https:";

  for (const name of LEGACY_HOST_ONLY_COOKIES) {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      secure,
      sameSite: "lax",
    });
  }

  response.headers.set("Cache-Control", "no-store");
  return response;
}
