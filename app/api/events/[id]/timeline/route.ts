import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";
import { ZodError, z } from "zod";

type Params = { params: Promise<{ id: string }> };

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  phase: z.string().min(1),
  status: z.enum(["TODO", "DOING", "DONE"]).default("TODO"),
});

// GET /api/events/[id]/timeline
export async function GET(_req: Request, { params }: Params) {
  const routeParams = await params;
  const tasks = await prisma.timelineTask.findMany({
    where: { eventId: routeParams.id },
    orderBy: { dueDate: "asc" },
  });
  return NextResponse.json(tasks);
}

// POST /api/events/[id]/timeline — add a manual task
export async function POST(req: Request, { params }: Params) {
  const routeParams = await params;
  try {
    const body = await req.json();
    const data = CreateTaskSchema.parse(body);

    const task = await prisma.timelineTask.create({
      data: {
        eventId: routeParams.id,
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
        phase: data.phase,
        status: data.status,
        aiGenerated: false,
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}



