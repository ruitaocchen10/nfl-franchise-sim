/**
 * Root Layout
 * Global layout wrapper for the entire application
 */

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NFL Franchise Simulator",
  description:
    "Manage your NFL franchise, draft players, make trades, and build a dynasty",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
