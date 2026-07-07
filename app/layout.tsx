import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAS AI Assistant",
  description: "AI assistant for MAS Volunteer Coordinators.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
