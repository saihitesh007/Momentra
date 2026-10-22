import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";
import { callGemini } from "@/backend/lib/gemini";
import { buildBudgetPrompt } from "@/backend/lib/prompts";
import { GeminiBudgetSchema } from "@/backend/lib/schemas";

// POST /api/ai/budget
// Body: { eventId: string }
export async function POST(req: Request) {
  try {
    const { eventId } = await req.json();
    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const prompt = buildBudgetPrompt(event);
    const result = await callGemini(prompt, GeminiBudgetSchema);

    // Delete existing AI-generated rows, keep user-edited ones
    await prisma.budgetItem.deleteMany({ where: { eventId, aiGenerated: true } });

    // Insert new AI rows
    const created = await prisma.budgetItem.createMany({
      data: result.items.map((item) => ({
        eventId,
        category: item.category,
        label: item.label,
        percentage: item.percentage,
        estimated: item.estimated,
        actual: 0,
        paid: false,
        aiGenerated: true,
      })),
    });

    const items = await prisma.budgetItem.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ items, created: created.count });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("429")) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


