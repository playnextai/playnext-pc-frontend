import type { FeedbackAction } from "./types.ts";

/** The four feed-card actions (final design; "dislike" exists on the detail page only). */
export type CardAction = "like" | "not_interested" | "already_own" | "wishlist";

export const CARD_ACTIONS: { action: CardAction; labelKey: "card.like" | "card.notInterested" | "card.alreadyOwn" | "card.wishlist"; icon: "heart" | "x" | "check" | "bookmark" }[] = [
  { action: "like", labelKey: "card.like", icon: "heart" },
  { action: "not_interested", labelKey: "card.notInterested", icon: "x" },
  { action: "already_own", labelKey: "card.alreadyOwn", icon: "check" },
  { action: "wishlist", labelKey: "card.wishlist", icon: "bookmark" },
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
