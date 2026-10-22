import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";
import { callGemini } from "@/backend/lib/gemini";
import { buildVendorPrompt } from "@/backend/lib/prompts";
import { GeminiVendorSchema } from "@/backend/lib/schemas";

// POST /api/ai/vendors
export async function POST(req: Request) {
  try {
    const { eventId } = await req.json();
    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const prompt = buildVendorPrompt(event);
    const result = await callGemini(prompt, GeminiVendorSchema);

    // Delete existing AI-generated vendor rows, keep user-edited ones
    await prisma.vendorItem.deleteMany({ where: { eventId, aiGenerated: true } });

    await prisma.vendorItem.createMany({
      data: result.vendors.map((v) => ({
        eventId,
        category: v.category,
        questionsToAsk: JSON.stringify(v.questionsToAsk),
        documentsNeeded: JSON.stringify(v.documentsNeeded),
        paymentTips: v.paymentTips,
        status: "SHORTLIST",
        aiGenerated: true,
      })),
    });

    const vendors = await prisma.vendorItem.findMany({
      where: { eventId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ vendors, count: vendors.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("429")) return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


