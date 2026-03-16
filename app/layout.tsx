import type { Viewport } from "next";
import "./globals.css";

/**
 * Root layout - minimal wrapper that redirects to locale-prefixed routes.
 * The actual layout with providers is in app/[lang]/layout.tsx.
 */
export const viewport: Viewport = {
  themeColor: "#10B981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
