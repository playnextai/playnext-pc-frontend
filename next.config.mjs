/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export default {
  reactStrictMode: true,
  // The browser only ever talks to this site (same origin) at /api/*; Next
  // forwards to the Python backend. No CORS, and the session cookie that the
  // backend sets (Domain=.playnextai.com) comes straight through.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/:path*` }];
  },
};
