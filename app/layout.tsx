import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geist = localFont({ src: "./fonts/GeistVF.woff", variable: "--font-geist", weight: "100 900" });

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
    <html lang="en" className={geist.variable} data-scroll-behavior="smooth">
      <body className="antialiased">
        <a className="skip-link" href="#main">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}

