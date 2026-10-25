import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";
import { UpdateBudgetItemSchema } from "@/backend/lib/schemas";
import { handleRoute } from "@/backend/lib/api";

type Params = { params: Promise<{ id: string; itemId: string }> };

/** Updates a budget row scoped to its parent event. */
export async function PATCH(req: Request, { params }: Params): Promise<Response> {
  return handleRoute(async () => {
    const { id, itemId } = await params;
    const data = UpdateBudgetItemSchema.parse(await req.json());
    const item = await prisma.budgetItem.update({
      where: { id: itemId, eventId: id },
      data: { ...data, aiGenerated: false },
    });
    return NextResponse.json(item);
  });
}
