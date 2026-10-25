import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/backend/lib/db";
import { handleRoute } from "@/backend/lib/api";

type Params = { params: Promise<{ id: string }> };
const CreateIdeaSchema = z.object({
  category: z.enum(["theme", "menu", "decor", "activity", "gift"]),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1000),
}).strict();

/** Lists event ideas. */
export async function GET(_req: Request, { params }: Params): Promise<Response> {
  return handleRoute(async () => {
    const { id } = await params;
    const ideas = await prisma.idea.findMany({ where: { eventId: id }, orderBy: { createdAt: "asc" } });
    return NextResponse.json(ideas);
  });
}

/** Adds a user-created idea to an existing event. */
export async function POST(req: Request, { params }: Params): Promise<Response> {
  return handleRoute(async () => {
    const { id } = await params;
    const data = CreateIdeaSchema.parse(await req.json());
    const eventExists = await prisma.event.findUnique({ where: { id }, select: { id: true } });
    if (!eventExists) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    const idea = await prisma.idea.create({ data: { ...data, eventId: id, aiGenerated: false } });
    return NextResponse.json(idea, { status: 201 });
  });
}
