import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";
import { UpdateTaskSchema } from "@/backend/lib/schemas";
import { ZodError } from "zod";

type Params = { params: Promise<{ id: string; taskId: string }> };

// PATCH /api/events/[id]/timeline/[taskId]
export async function PATCH(req: Request, { params }: Params) {
  const routeParams = await params;
  try {
    const body = await req.json();
    const data = UpdateTaskSchema.parse(body);

    const task = await prisma.timelineTask.update({
      where: { id: routeParams.taskId, eventId: routeParams.id },
      data: { ...data, aiGenerated: false },
    });
    return NextResponse.json(task);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/events/[id]/timeline/[taskId]
export async function DELETE(_req: Request, { params }: Params) {
  const routeParams = await params;
  try {
    await prisma.timelineTask.delete({ where: { id: routeParams.taskId, eventId: routeParams.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}



