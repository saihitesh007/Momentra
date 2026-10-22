import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Momentra — AI Event Planner",
  description:
    "Plan your wedding, birthday, or community event with AI. Momentra generates budgets, timelines, vendor checklists, and personalized ideas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}

