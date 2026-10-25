import { Suspense } from "react";
import type { Metadata } from "next";
import NewEventClient from "./NewEventClient";

export const metadata: Metadata = { title: "Plan a New Event | Momentra" };

export default function NewEventPage() {
  return (
    <Suspense fallback={<div className="min-h-screen hero-gradient" />}>
      <NewEventClient />
    </Suspense>
  );
}

