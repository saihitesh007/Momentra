import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/backend/lib/db";
import { callGemini } from "@/backend/lib/gemini";
import { buildBudgetPrompt } from "@/backend/lib/prompts";
import { GeminiBudgetSchema } from "@/backend/lib/schemas";
import { handleRoute } from "@/backend/lib/api";
import { rateLimitResponse } from "@/backend/lib/rateLimit";
import { computeEstimated, normalizePercentages } from "@/backend/lib/money";

const EventIdSchema = z.object({ eventId: z.string().min(1).max(64) }).strict();

/** Generates a budget breakdown and atomically replaces only AI-generated rows. */
export async function POST(req: Request): Promise<Response> {
  const limited = rateLimitResponse(req, "ai-budget");
  if (limited) return limited;
  return handleRoute(async () => {
    const { eventId } = EventIdSchema.parse(await req.json());
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    const result = await callGemini(buildBudgetPrompt(event), GeminiBudgetSchema);
    const normalized = normalizePercentages(result.items);
    const items = await prisma.$transaction(async (tx) => {
      await tx.budgetItem.deleteMany({ where: { eventId, aiGenerated: true } });
      await tx.budgetItem.createMany({ data: normalized.map((item) => ({
        eventId,
        category: item.category,
        label: item.label,
        percentage: item.percentage,
        estimated: computeEstimated(item.percentage, event.budget),
        actual: 0,
        paid: false,
        aiGenerated: true,
      })) });
      return tx.budgetItem.findMany({ where: { eventId }, orderBy: { createdAt: "asc" } });
    });
    return NextResponse.json({ items, created: normalized.length });
  });
}
