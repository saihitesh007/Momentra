import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/backend/lib/db";
import { handleRoute } from "@/backend/lib/api";

type Params = { params: Promise<{ id: string; ideaId: string }> };
const UpdateIdeaSchema = z.object({
  saved: z.boolean().optional(),
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().min(1).max(1000).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "At least one field is required");

/** Updates an idea scoped to its parent event. */
export async function PATCH(req: Request, { params }: Params): Promise<Response> {
  return handleRoute(async () => {
    const { id, ideaId } = await params;
    const data = UpdateIdeaSchema.parse(await req.json());
    const idea = await prisma.idea.update({ where: { id: ideaId, eventId: id }, data });
    return NextResponse.json(idea);
  });
}
