import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StraitWatch — Real-time Maritime Intelligence",
  description:
    "Track shadow fleet activity, sanctioned tankers, and ship-to-ship transfers through the Strait of Hormuz and Bab al-Mandab.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
