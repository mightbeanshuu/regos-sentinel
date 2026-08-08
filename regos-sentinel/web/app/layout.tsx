import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

/* One file per surface, loaded after the design system so a surface can override
   it without editing it. `globals.css` holds classes shared by several tabs —
   `.jr-shell`/`.jr-sidenav` are used by three — so editing it from one surface's
   workstream silently breaks the others. These files keep that from happening. */
import "./parts/dashboard.css";
import "./parts/review.css";
import "./parts/upload.css";
import "./parts/assistants.css";
import "./parts/record.css";

/* The Romer skin loads LAST, after every surface, because it redefines the
   `:root` tokens the whole system reads its colour from. Importing it earlier
   would let a surface file's literal colours win over the theme. */
import "./parts/romer.css";

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
