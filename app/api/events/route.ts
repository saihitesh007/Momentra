import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";
import { CreateEventSchema } from "@/backend/lib/schemas";
import { ZodError } from "zod";

// GET /api/events — list all events with task progress
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { timelineTasks: true } },
        timelineTasks: { select: { status: true } },
      },
    });
    return NextResponse.json(events);
  } catch {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST /api/events — create a new event
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = CreateEventSchema.parse(body);

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
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}



