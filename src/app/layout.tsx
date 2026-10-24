import type { Metadata, Viewport } from "next";
import { Gveret_Levin, IBM_Plex_Sans_Hebrew } from "next/font/google";
import "./globals.css";

const plex = IBM_Plex_Sans_Hebrew({
  variable: "--font-plex",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const hand = Gveret_Levin({
  variable: "--font-hand",
  subsets: ["hebrew", "latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "שני עולמות · מאור חדאד, מפתח תוכנה",
  description:
    "מאור חדאד, מפתח תוכנה. אתרים, אפליקציות ומערכות: אותו רעיון, מהסקיצה ועד מוצר שעובד. גררו את הקו בין העולמות.",
};

export const viewport: Viewport = {
  themeColor: "#d8d5cd",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${plex.variable} ${hand.variable}`} suppressHydrationWarning>
      <body>
        <script
          // Marks the document as scripted before first paint, so entrance styles never hide content without JS.
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
        {children}
      </body>
    </html>
  );
}
