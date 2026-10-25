import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlayNext — Play more. Choose better.",
  description: "Game recommendations tuned to your taste, with prices that make sense for you.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
