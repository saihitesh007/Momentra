import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/backend/lib/db";
import { callGemini } from "@/backend/lib/gemini";
import { buildIdeasPrompt } from "@/backend/lib/prompts";
import { GeminiIdeasSchema } from "@/backend/lib/schemas";
import { handleRoute } from "@/backend/lib/api";
import { rateLimitResponse } from "@/backend/lib/rateLimit";

const EventIdSchema = z.object({ eventId: z.string().min(1).max(64) }).strict();

/** Generates personalized ideas and atomically replaces unsaved AI-generated rows. */
export async function POST(req: Request): Promise<Response> {
  const limited = rateLimitResponse(req, "ai-ideas");
  if (limited) return limited;
  return handleRoute(async () => {
    const { eventId } = EventIdSchema.parse(await req.json());
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    const result = await callGemini(buildIdeasPrompt(event), GeminiIdeasSchema);
    const ideas = await prisma.$transaction(async (tx) => {
      await tx.idea.deleteMany({ where: { eventId, aiGenerated: true, saved: false } });
      await tx.idea.createMany({ data: result.ideas.map((idea) => ({
        eventId,
        category: idea.category,
        title: idea.title,
        description: idea.description,
        saved: false,
        aiGenerated: true,
      })) });
      return tx.idea.findMany({ where: { eventId }, orderBy: { createdAt: "asc" } });
    });
    return NextResponse.json({ ideas, count: ideas.length });
  });
}
