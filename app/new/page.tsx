import { Suspense } from "react";
import NewEventClient from "./NewEventClient";

export default function NewEventPage() {
  return (
    <Suspense fallback={<div className="min-h-screen hero-gradient" />}>
      <NewEventClient />
    </Suspense>
  );
}

