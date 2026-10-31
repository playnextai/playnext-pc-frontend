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
  const { t, toman, native: nativeFmt, percent } = useI18n();
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
    <article className="card">
      <button onClick={() => onOpen?.(game.game_id)} style={{ all: "unset", cursor: onOpen ? "pointer" : "default", display: "block", width: "100%" }}>
        {game.cover_url ? <img className="cover" src={game.cover_url} alt="" /> : <span className="cover" />}
        <h3 style={{ margin: "10px 0 4px", fontSize: "1rem" }}>{game.title}</h3>
      </button>
      {game.reason && <p className="muted" style={{ fontSize: ".8rem", margin: "0 0 6px" }}>{game.reason}</p>}
      <div className="price">
        {toman(game.price_toman)}
        {!!game.discount_pct && <span style={{ color: "var(--danger)", background: "var(--danger-bg)", borderRadius: 6, padding: "1px 6px", marginInlineStart: 8, fontSize: ".8rem" }}>-{percent(game.discount_pct)}</span>}
      </div>
      {native && <div className="muted" style={{ fontSize: ".85rem" }}>{native}</div>}
      <div role="group" aria-label={t("card.actions")} style={{ display: "flex", gap: 6, marginTop: 10 }}>
        {CARD_ACTIONS.map(({ action, labelKey, icon }) => {
          const label = t(labelKey);
          const on = (action === "wishlist" && wishlisted) || (action === "like" && liked);
          return (
            <button key={action} title={label} aria-label={label} aria-pressed={on} disabled={busy}
              onClick={() => act(action)}
              style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 40, background: on ? "var(--surface-2)" : "transparent", color: on ? "var(--mint)" : "var(--text)", cursor: "pointer" }}>
              <Icon name={icon} />
            </button>
          );
        })}
      </div>
      {error && <p className="error" style={{ fontSize: ".8rem" }}>{error}</p>}
    </article>
  );
}
