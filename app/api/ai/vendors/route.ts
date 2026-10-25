import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/backend/lib/db";
import { callGemini } from "@/backend/lib/gemini";
import { buildVendorPrompt } from "@/backend/lib/prompts";
import { GeminiVendorSchema } from "@/backend/lib/schemas";
import { handleRoute } from "@/backend/lib/api";
import { rateLimitResponse } from "@/backend/lib/rateLimit";

const EventIdSchema = z.object({ eventId: z.string().min(1).max(64) }).strict();

/** Generates vendor checklists and atomically replaces only AI-generated rows. */
export async function POST(req: Request): Promise<Response> {
  const limited = rateLimitResponse(req, "ai-vendors");
  if (limited) return limited;
  return handleRoute(async () => {
    const { eventId } = EventIdSchema.parse(await req.json());
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    const result = await callGemini(buildVendorPrompt(event), GeminiVendorSchema);
    const vendors = await prisma.$transaction(async (tx) => {
      await tx.vendorItem.deleteMany({ where: { eventId, aiGenerated: true } });
      await tx.vendorItem.createMany({ data: result.vendors.map((vendor) => ({
        eventId,
        category: vendor.category,
        questionsToAsk: JSON.stringify(vendor.questionsToAsk),
        documentsNeeded: JSON.stringify(vendor.documentsNeeded),
        paymentTips: vendor.paymentTips,
        status: "SHORTLIST",
        aiGenerated: true,
      })) });
      return tx.vendorItem.findMany({ where: { eventId }, orderBy: { createdAt: "asc" } });
    });
    return NextResponse.json({ vendors, count: vendors.length });
  });
}
