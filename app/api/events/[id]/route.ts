import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";
import { UpdateEventSchema } from "@/backend/lib/schemas";
import { handleRoute } from "@/backend/lib/api";

type Params = { params: Promise<{ id: string }> };

/** Fetches one event and its planning data. */
export async function GET(_req: Request, { params }: Params): Promise<Response> {
  return handleRoute(async () => {
    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        budgetItems: { orderBy: { createdAt: "asc" } },
        timelineTasks: { orderBy: { dueDate: "asc" } },
        vendorItems: { orderBy: { createdAt: "asc" } },
        ideas: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    return NextResponse.json(event, { headers: { "Cache-Control": "no-store" } });
  });
}

/** Updates an event using an allowlisted payload. */
export async function PATCH(req: Request, { params }: Params): Promise<Response> {
  return handleRoute(async () => {
    const { id } = await params;
    const data = UpdateEventSchema.parse(await req.json());
    const updated = await prisma.event.update({
      where: { id },
      data: { ...data, date: data.date ? new Date(data.date) : undefined },
    });
    return NextResponse.json(updated);
  });
}

/** Deletes an event and its related plan rows. */
export async function DELETE(_req: Request, { params }: Params): Promise<Response> {
  return handleRoute(async () => {
    const { id } = await params;
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true });
  });
}
