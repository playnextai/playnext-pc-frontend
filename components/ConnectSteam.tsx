"use client";
import { useEffect, useState } from "react";
import { steamSignInUrl } from "@/lib/auth";
import { dismiss, isDismissed } from "@/lib/dismiss";
import Icon from "@/components/Icon";
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
      <div className="card steam-banner" role="note">
        <span style={{ color: "var(--mint)", display: "inline-flex" }}><Icon name="gamepad" /></span>
        <span style={{ flex: 1, minWidth: 0, lineHeight: 1.5 }}>{t("steam.bannerText")}</span>
        <a className="btn secondary small" href={href}>{t("steam.connectShort")}</a>
        <button className="icon-btn" aria-label={t("steam.notNow")} onClick={() => { dismiss("connect-steam-banner"); setHidden(true); }}><Icon name="x" /></button>
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
