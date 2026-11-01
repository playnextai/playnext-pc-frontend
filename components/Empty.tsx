"use client";
import type { ReactNode } from "react";
import Icon, { type IconName } from "@/components/Icon";

/** Dashed empty-state card used by Library, Wishlist, Cart and the system states. */
export default function Empty({ icon = "gamepad", title, text, children, asPage = false }: { icon?: IconName; title: string; text?: string; children?: ReactNode; asPage?: boolean }) {
  return (
    <div className="card dashed" style={{ textAlign: "center", padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <span style={{ width: 56, height: 56, borderRadius: 14, border: "1px solid var(--border)", background: "#191918", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mint)" }}><Icon name={icon} className="icon" /></span>
      {asPage ? <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>{title}</h1> : <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>{title}</h2>}
      {text && <p className="muted" style={{ margin: 0, maxWidth: 440 }}>{text}</p>}
      {children}
    </div>
  );
}
