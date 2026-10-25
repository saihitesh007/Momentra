import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/backend/lib/db";
import { callGemini } from "@/backend/lib/gemini";
import { buildChatPrompt } from "@/backend/lib/prompts";
import { ChatMessageSchema, GeminiChatSchema } from "@/backend/lib/schemas";
import { handleRoute } from "@/backend/lib/api";
import { rateLimitResponse } from "@/backend/lib/rateLimit";

const ChatRequestSchema = z.object({
  eventId: z.string().min(1).max(64),
  message: ChatMessageSchema.shape.message,
  history: ChatMessageSchema.shape.history,
}).strict();

/** Responds to chat with event context and validated, approval-only suggested actions. */
export async function POST(req: Request): Promise<Response> {
  const limited = rateLimitResponse(req, "ai-chat");
  if (limited) return limited;
  return handleRoute(async () => {
    const parsed = ChatRequestSchema.parse(await req.json());
    const { eventId } = parsed;
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    const [budgetItems, tasks, vendors] = await Promise.all([
      prisma.budgetItem.findMany({
        where: { eventId },
        take: 20,
        orderBy: { createdAt: "desc" },
        select: { label: true, estimated: true, actual: true },
      }),
      prisma.timelineTask.findMany({
        where: { eventId, status: { not: "DONE" } },
        take: 10,
        orderBy: { dueDate: "asc" },
        select: { status: true, title: true, dueDate: true },
      }),
      prisma.vendorItem.findMany({
        where: { eventId },
        take: 20,
        orderBy: { createdAt: "desc" },
        select: { category: true, name: true, status: true },
      }),
    ]);
    const prompt = buildChatPrompt(event, budgetItems, tasks, vendors, parsed.history.slice(-10), parsed.message);
    return NextResponse.json(await callGemini(prompt, GeminiChatSchema));
  });
}
