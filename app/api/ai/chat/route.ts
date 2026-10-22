import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";
import { callGemini } from "@/backend/lib/gemini";
import { buildChatPrompt } from "@/backend/lib/prompts";
import { ChatMessageSchema, GeminiChatSchema } from "@/backend/lib/schemas";
import { ZodError } from "zod";

// POST /api/ai/chat
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, message, history } = body;

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    // Validate message + history
    const parsed = ChatMessageSchema.parse({ message, history });

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // Get context: last 10 messages from history
    const recentHistory = parsed.history.slice(-10);

    const budgetItems = await prisma.budgetItem.findMany({ where: { eventId } });
    const tasks = await prisma.timelineTask.findMany({ where: { eventId } });
    const vendors = await prisma.vendorItem.findMany({ where: { eventId } });

    const prompt = buildChatPrompt(event, budgetItems, tasks, vendors, recentHistory, parsed.message);
    const result = await callGemini(prompt, GeminiChatSchema);

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.issues }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("429")) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


