import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";
import { UpdateTaskSchema } from "@/backend/lib/schemas";
import { handleRoute } from "@/backend/lib/api";

type Params = { params: Promise<{ id: string; taskId: string }> };

/** Updates a timeline task scoped to its parent event. */
export async function PATCH(req: Request, { params }: Params): Promise<Response> {
  return handleRoute(async () => {
    const { id, taskId } = await params;
    const data = UpdateTaskSchema.parse(await req.json());
    const task = await prisma.timelineTask.update({ where: { id: taskId, eventId: id }, data: { ...data, aiGenerated: false } });
    return NextResponse.json(task);
  });
}

/** Deletes a timeline task scoped to its event. */
export async function DELETE(_req: Request, { params }: Params): Promise<Response> {
  return handleRoute(async () => {
    const { id, taskId } = await params;
    await prisma.timelineTask.delete({ where: { id: taskId, eventId: id } });
    return NextResponse.json({ success: true });
  });
}
