import type { Metadata } from "next";
import "./globals.css";
import I18nProvider from "@/components/I18nProvider";

export const metadata: Metadata = {
  title: "PlayNext — Play more. Choose better.",
  description: "Game recommendations tuned to your taste, with prices that make sense for you.",
};

// Runs before first paint so a saved Farsi choice does not flash left-to-right English.
const LANG_BOOT = `try{var l=localStorage.getItem("playnext:lang");if(l!=="en"&&l!=="fa"){l=(navigator.language||"").toLowerCase().indexOf("fa")===0?"fa":"en"}document.documentElement.lang=l;document.documentElement.dir=l==="fa"?"rtl":"ltr"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Vazirmatn:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOT }} />
      </head>
      <body><I18nProvider>{children}</I18nProvider></body>
    </html>
  );
}
