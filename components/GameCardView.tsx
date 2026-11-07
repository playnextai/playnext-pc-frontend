"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { CARD_ACTIONS, REMOVES_CARD, feedbackFor, type CardAction } from "@/lib/cards";
import Icon from "@/components/Icon";
import { useI18n } from "@/components/I18nProvider";
import type { GameCard } from "@/lib/types";

/** Feed card: cover, title, Toman-primary price with the native price beneath, and the four
 *  designed actions on their own line (price and actions are separate rows by design).
 *  `onRemove` lets the parent drop the card after "not interested" / "already own". */
export default function GameCardView({ game, onRemove, onOpen }: {
  game: GameCard;
  onRemove?: (gameId: number) => void;
  onOpen?: (gameId: number) => void;
}) {
  const { t, toman, native: nativeFmt, percent, reason } = useI18n();
  const [wishlisted, setWishlisted] = useState(!!game.in_wishlist);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: CardAction) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const fb = feedbackFor(action);
      if (fb) await api.feedback(game.game_id, fb);
      else if (!wishlisted) await api.addToWishlist(game.game_id);
      if (action === "wishlist") setWishlisted(true);
      if (action === "like") setLiked(true);
      if (REMOVES_CARD.has(action)) onRemove?.(game.game_id);
    } catch {
      setError(t("common.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  const native = nativeFmt(game.price_native, game.price_currency);
  return (
    <article className="gcard">
      <button onClick={() => onOpen?.(game.game_id)} className="gc-open" style={{ cursor: onOpen ? "pointer" : "default" }}>
        <span className="gc-cover">
          {game.cover_url ? <img src={game.cover_url} alt="" /> : <span className="gc-name" dir="auto" aria-hidden="true">{game.title}</span>}
          {!!game.discount_pct && game.price_toman !== null && <span className="gc-badge">-{percent(game.discount_pct)}</span>}
        </span>
        <h3 dir="auto">{game.title}</h3>
      </button>
      <div className="gc-body">
        {game.reason && <p className="muted gc-reason">{reason(game.reason)}</p>}
        <div className="price" style={{ fontSize: "1.05rem" }}>{toman(game.price_toman)}</div>
        {native && <div className="muted" style={{ fontSize: ".85rem" }}>{native} {t("card.yourRegion")}</div>}
      <div role="group" aria-label={t("card.actions")} style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        {CARD_ACTIONS.map(({ action, labelKey, icon }) => {
          const label = t(labelKey);
          const on = (action === "wishlist" && wishlisted) || (action === "like" && liked);
          return (
            <button key={action} title={label} aria-label={label} aria-pressed={on} disabled={busy}
              onClick={() => act(action)}
              className="icon-btn" style={{ color: on ? "var(--mint)" : undefined }}>
              <Icon name={icon} />
            </button>
          );
        })}
      </div>
      {error && <p className="error" style={{ fontSize: ".8rem" }}>{error}</p>}
      </div>
    </article>
  );
}
