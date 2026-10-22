import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";
import { callGemini } from "@/backend/lib/gemini";
import { buildIdeasPrompt } from "@/backend/lib/prompts";
import { GeminiIdeasSchema } from "@/backend/lib/schemas";

// POST /api/ai/ideas
export async function POST(req: Request) {
  try {
    const { eventId } = await req.json();
    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const prompt = buildIdeasPrompt(event);
    const result = await callGemini(prompt, GeminiIdeasSchema);

    // Delete AI-generated ideas only; keep saved ones
    await prisma.idea.deleteMany({ where: { eventId, aiGenerated: true, saved: false } });

    await prisma.idea.createMany({
      data: result.ideas.map((idea) => ({
        eventId,
        category: idea.category,
        title: idea.title,
        description: idea.description,
        saved: false,
        aiGenerated: true,
      })),
    });

    const ideas = await prisma.idea.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ ideas, count: ideas.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("429")) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


