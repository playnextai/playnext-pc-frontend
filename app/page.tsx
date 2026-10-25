"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { signInUrl, steamSignInUrl } from "@/lib/auth";

// Logged-out landing page. Sign-in buttons are plain links to the auth site.
export default function Landing() {
  const router = useRouter();
  useEffect(() => {
    api.me().then((me) => { if (me.authenticated) router.replace("/discover"); }).catch(() => {});
  }, [router]);

  return (
    <main className="container" style={{ paddingTop: 72, textAlign: "center" }}>
      <img src="/brand/logo-controller-dark.png" alt="PlayNext" width={220} height={220} style={{ borderRadius: 24 }} />
      <h1 style={{ fontSize: "2.4rem", margin: "24px 0 8px" }}>Play more. Choose better.</h1>
      <p className="muted" style={{ maxWidth: 520, margin: "0 auto 28px" }}>
        Game picks tuned to your taste, with prices shown in Toman.
      </p>
      <p style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <a className="btn" href={steamSignInUrl("/discover")}>Sign in with Steam</a>
        <a className="btn secondary" href={signInUrl("/discover")}>Use email instead</a>
      </p>
    </main>
  );
}
