import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";
import { UpdateEventSchema } from "@/backend/lib/schemas";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string }> };

// GET /api/events/[id]
export async function GET(_req: Request, { params }: Params) {
  const routeParams = await params;
  const event = await prisma.event.findUnique({
    where: { id: routeParams.id },
    include: {
      budgetItems: { orderBy: { createdAt: "asc" } },
      timelineTasks: { orderBy: { dueDate: "asc" } },
      vendorItems: { orderBy: { createdAt: "asc" } },
      ideas: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json(event);
}

// PATCH /api/events/[id]
export async function PATCH(req: Request, { params }: Params) {
  const routeParams = await params;
  try {
    const body = await req.json();
    const data = UpdateEventSchema.parse(body);

    const updated = await prisma.event.update({
      where: { id: routeParams.id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

// DELETE /api/events/[id]
export async function DELETE(_req: Request, { params }: Params) {
  const routeParams = await params;
  try {
    await prisma.event.delete({ where: { id: routeParams.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}



