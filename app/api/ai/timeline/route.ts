import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/backend/lib/db";
import { callGemini } from "@/backend/lib/gemini";
import { buildTimelinePrompt } from "@/backend/lib/prompts";
import { GeminiTimelineSchema } from "@/backend/lib/schemas";
import { handleRoute } from "@/backend/lib/api";
import { rateLimitResponse } from "@/backend/lib/rateLimit";
import { clampDueDate } from "@/backend/lib/dates";

const EventIdSchema = z.object({ eventId: z.string().min(1).max(64) }).strict();

/** Generates a phased timeline and atomically replaces only AI-generated rows. */
export async function POST(req: Request): Promise<Response> {
  const limited = rateLimitResponse(req, "ai-timeline");
  if (limited) return limited;
  return handleRoute(async () => {
    const { eventId } = EventIdSchema.parse(await req.json());
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    const result = await callGemini(buildTimelinePrompt(event), GeminiTimelineSchema);
    const safeTasks = result.tasks.map((task) => ({ ...task, dueDate: clampDueDate(task.dueDate, event.date) }));
    const tasks = await prisma.$transaction(async (tx) => {
      await tx.timelineTask.deleteMany({ where: { eventId, aiGenerated: true } });
      await tx.timelineTask.createMany({ data: safeTasks.map((task) => ({
        eventId,
        phase: task.phase,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        status: task.status,
        aiGenerated: true,
      })) });
      return tx.timelineTask.findMany({ where: { eventId }, orderBy: { dueDate: "asc" } });
    });
    return NextResponse.json({ tasks, count: tasks.length });
  });
}
