import { notFound } from "next/navigation";
import { prisma } from "@/backend/lib/db";
import EventDashboardClient from "./EventDashboardClient";

interface Props {
  params: { id: string };
  searchParams: { new?: string };
}

export default async function EventDashboardPage({ params, searchParams }: Props) {
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      budgetItems:   { orderBy: { createdAt: "asc" } },
      timelineTasks: { orderBy: { dueDate: "asc" } },
      vendorItems:   { orderBy: { createdAt: "asc" } },
      ideas:         { orderBy: { createdAt: "asc" } },
    },
  });

  if (!event) notFound();

  const isNew = searchParams.new === "1";

  return (
    <EventDashboardClient
      event={{
        ...event,
        date: event.date.toISOString(),
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
      }}
      budgetItems={event.budgetItems.map((b) => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
      }))}
      timelineTasks={event.timelineTasks.map((t) => ({
        ...t,
        dueDate: t.dueDate.toISOString(),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      }))}
      vendorItems={event.vendorItems.map((v) => ({
        ...v,
        createdAt: v.createdAt.toISOString(),
        updatedAt: v.updatedAt.toISOString(),
      }))}
      ideas={event.ideas.map((i) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      }))}
      isNew={isNew}
    />
  );
}

