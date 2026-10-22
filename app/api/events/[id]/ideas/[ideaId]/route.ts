import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";
import { z, ZodError } from "zod";

type Params = { params: Promise<{ id: string; ideaId: string }> };

const UpdateIdeaSchema = z.object({
  saved: z.boolean().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

// PATCH /api/events/[id]/ideas/[ideaId]
export async function PATCH(req: Request, { params }: Params) {
  const routeParams = await params;
  try {
    const body = await req.json();
    const data = UpdateIdeaSchema.parse(body);

    const idea = await prisma.idea.update({
      where: { id: routeParams.ideaId, eventId: routeParams.id },
      data,
    });
    return NextResponse.json(idea);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update idea" }, { status: 500 });
  }
}



