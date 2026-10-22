import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";
import { callGemini } from "@/backend/lib/gemini";
import { buildTimelinePrompt } from "@/backend/lib/prompts";
import { GeminiTimelineSchema } from "@/backend/lib/schemas";

// POST /api/ai/timeline
export async function POST(req: Request) {
  try {
    const { eventId } = await req.json();
    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const prompt = buildTimelinePrompt(event);
    const result = await callGemini(prompt, GeminiTimelineSchema);

    // Delete existing AI-generated tasks, keep user-created ones
    await prisma.timelineTask.deleteMany({ where: { eventId, aiGenerated: true } });

    await prisma.timelineTask.createMany({
      data: result.tasks.map((task) => ({
        eventId,
        phase: task.phase,
        title: task.title,
        description: task.description,
        dueDate: new Date(task.dueDate),
        status: task.status,
        aiGenerated: true,
      })),
    });

    const tasks = await prisma.timelineTask.findMany({
      where: { eventId },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ tasks, count: tasks.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("429")) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


