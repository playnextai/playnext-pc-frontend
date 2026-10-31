"use client";
import { useEffect, useState } from "react";
import { steamSignInUrl } from "@/lib/auth";
import { dismiss, isDismissed } from "@/lib/dismiss";
import { useI18n } from "@/components/I18nProvider";

/** Reusable "Connect Steam" prompt. `card` is used in Settings > Connected Accounts;
 *  `banner` is the compact dismissible nudge on the Wishlist page. A nudge only - it never blocks manual use.
 *  Connecting goes through the shared auth site like every other sign-in. */
export default function ConnectSteam({ variant, returnPath = "/settings" }: { variant: "card" | "banner"; returnPath?: string }) {
  const { t } = useI18n();
  const [hidden, setHidden] = useState(false);
  useEffect(() => { if (variant === "banner" && isDismissed("connect-steam-banner")) setHidden(true); }, [variant]);
  if (hidden) return null;
  const href = steamSignInUrl(returnPath);

  if (variant === "banner") {
    return (
      <div className="card" role="note" style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <span>{t("steam.bannerText")}</span>
        <span style={{ display: "flex", gap: 8 }}>
          <a className="btn" href={href}>{t("steam.connect")}</a>
          <button className="btn secondary" onClick={() => { dismiss("connect-steam-banner"); setHidden(true); }}>{t("steam.notNow")}</button>
        </span>
      </div>
    );
  }
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{t("steam.cardTitle")}</h3>
      <p className="muted">{t("steam.cardText")}</p>
      <a className="btn" href={href}>{t("steam.connect")}</a>
    </div>
  );
}
