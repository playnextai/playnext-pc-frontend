import type { FeedbackAction } from "./types.ts";

/** The four feed-card actions (final design; "dislike" exists on the detail page only). */
export type CardAction = "like" | "not_interested" | "already_own" | "wishlist";

export const CARD_ACTIONS: { action: CardAction; label: string; icon: string }[] = [
  { action: "like", label: "Like", icon: "♥" },
  { action: "not_interested", label: "Not interested", icon: "✕" },
  { action: "already_own", label: "I already own this", icon: "✓" },
  { action: "wishlist", label: "Add to wishlist", icon: "★" },
];

/** Which feedback value the backend expects for a card action; wishlist is not feedback. */
export function feedbackFor(action: CardAction): FeedbackAction | null {
  switch (action) {
    case "like": return "liked";
    case "not_interested": return "not_interested";
    case "already_own": return "already_own";
    case "wishlist": return null;
  }
}

/** Actions that remove the card from the feed once recorded (the person has answered for that game). */
export const REMOVES_CARD: ReadonlySet<CardAction> = new Set(["not_interested", "already_own"]);
