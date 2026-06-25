import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "New Scouting CRM",
  description: "Lightweight CRM and Gmail communication tracker for New Scouting Management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
