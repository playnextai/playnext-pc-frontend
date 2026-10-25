"use client";
import { useEffect, useState } from "react";
import { steamSignInUrl } from "@/lib/auth";
import { dismiss, isDismissed } from "@/lib/dismiss";

/** Reusable "Connect Steam" prompt. `card` is used in Settings > Connected Accounts;
 *  `banner` is the compact dismissible nudge on the Wishlist page. A nudge only - it never blocks manual use.
 *  Connecting goes through the shared auth site like every other sign-in. */
export default function ConnectSteam({ variant, returnPath = "/settings" }: { variant: "card" | "banner"; returnPath?: string }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => { if (variant === "banner" && isDismissed("connect-steam-banner")) setHidden(true); }, [variant]);
  if (hidden) return null;
  const href = steamSignInUrl(returnPath);

  if (variant === "banner") {
    return (
      <div className="card" role="note" style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <span>Connect Steam to bring in your wishlist automatically.</span>
        <span style={{ display: "flex", gap: 8 }}>
          <a className="btn" href={href}>Connect Steam</a>
          <button className="btn secondary" onClick={() => { dismiss("connect-steam-banner"); setHidden(true); }}>Not now</button>
        </span>
      </div>
    );
  }
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Connect your Steam account</h3>
      <p className="muted">We'll import your library and wishlist so recommendations fit what you actually play. We only read what your profile shares publicly.</p>
      <a className="btn" href={href}>Connect Steam</a>
    </div>
  );
}
