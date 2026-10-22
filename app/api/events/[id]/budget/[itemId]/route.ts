import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";
import { UpdateBudgetItemSchema } from "@/backend/lib/schemas";
import { ZodError } from "zod";

type Params = { params: { id: string; itemId: string } };

// PATCH /api/events/[id]/budget/[itemId]
export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    const data = UpdateBudgetItemSchema.parse(body);

    const item = await prisma.budgetItem.update({
      where: { id: params.itemId, eventId: params.id },
      data: { ...data, aiGenerated: false }, // mark as user-edited
    });
    return NextResponse.json(item);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update budget item" }, { status: 500 });
  }
}


