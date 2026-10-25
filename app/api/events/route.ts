import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";
import { CreateEventSchema } from "@/backend/lib/schemas";
import { handleRoute } from "@/backend/lib/api";
import { rateLimitResponse } from "@/backend/lib/rateLimit";

/** Lists events and their task progress without caching user data. */
export async function GET(): Promise<Response> {
  return handleRoute(async () => {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, type: true, date: true, location: true,
        guestCount: true, budget: true, currency: true, createdAt: true,
        _count: { select: { timelineTasks: true } },
        timelineTasks: { select: { status: true } },
      },
    });
    return NextResponse.json(events, { headers: { "Cache-Control": "no-store" } });
  });
}

/** Creates a validated event. */
export async function POST(req: Request): Promise<Response> {
  const limited = rateLimitResponse(req, "create-event", 10);
  if (limited) return limited;
  return handleRoute(async () => {
    const data = CreateEventSchema.parse(await req.json());
    const event = await prisma.event.create({
      data: {
        name: data.name,
        type: data.type,
        date: new Date(data.date),
        location: data.location,
        guestCount: data.guestCount,
        budget: data.budget,
        currency: data.currency ?? "INR",
        notes: data.notes,
      },
    });
    return NextResponse.json(event, { status: 201 });
  });
}
