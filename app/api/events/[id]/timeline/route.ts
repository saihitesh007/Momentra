import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/backend/lib/db";
import { handleRoute } from "@/backend/lib/api";

type Params = { params: Promise<{ id: string }> };
const CreateTaskSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().date()),
  phase: z.string().trim().min(1).max(80),
  status: z.enum(["TODO", "DOING", "DONE"]).default("TODO"),
}).strict();

/** Lists timeline tasks for an event. */
export async function GET(_req: Request, { params }: Params): Promise<Response> {
  return handleRoute(async () => {
    const { id } = await params;
    const tasks = await prisma.timelineTask.findMany({ where: { eventId: id }, orderBy: { dueDate: "asc" } });
    return NextResponse.json(tasks);
  });
}

/** Adds a user-created timeline task after checking its event and date. */
export async function POST(req: Request, { params }: Params): Promise<Response> {
  return handleRoute(async () => {
    const { id } = await params;
    const data = CreateTaskSchema.parse(await req.json());
    const event = await prisma.event.findUnique({ where: { id }, select: { id: true, date: true } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    const dueDate = new Date(data.dueDate);
    if (dueDate > event.date) return NextResponse.json({ error: "Task date must be on or before the event date" }, { status: 400 });
    const task = await prisma.timelineTask.create({
      data: { eventId: id, title: data.title, description: data.description, dueDate, phase: data.phase, status: data.status, aiGenerated: false },
    });
    return NextResponse.json(task, { status: 201 });
  });
}
