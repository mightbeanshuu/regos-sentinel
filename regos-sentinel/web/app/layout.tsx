import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "RegOS Sentinel — Compliance Review",
  description:
    "A human-supervised prototype that turns SEBI circulars into checked, traceable compliance requirements.",
};

/**
 * Without an explicit viewport Next renders the 390px experience against a desktop
 * layout viewport, then scales it down. The review workflow becomes unreadable and
 * horizontal controls appear clipped even when their CSS is responsive.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
