import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

// GET /api/events/[id]/ideas
export async function GET(_req: Request, { params }: Params) {
  const routeParams = await params;
  const ideas = await prisma.idea.findMany({
    where: { eventId: routeParams.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(ideas);
}

// POST /api/events/[id]/ideas  (used by chat assistant)
const CreateIdeaSchema = z.object({
  category: z.enum(["theme", "menu", "decor", "activity", "gift"]),
  title: z.string().min(1),
  description: z.string().min(1),
});

export async function POST(req: Request, { params }: Params) {
  const routeParams = await params;
  try {
    const body = await req.json();
    const data = CreateIdeaSchema.parse(body);
    const idea = await prisma.idea.create({
      data: { ...data, eventId: routeParams.id, aiGenerated: false },
    });
    return NextResponse.json(idea, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create idea" }, { status: 500 });
  }
}




