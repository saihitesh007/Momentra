import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";
import { handleRoute } from "@/backend/lib/api";

type Params = { params: Promise<{ id: string }> };

/** Lists budget rows for an event. */
export async function GET(_req: Request, { params }: Params): Promise<Response> {
  return handleRoute(async () => {
    const { id } = await params;
    const items = await prisma.budgetItem.findMany({ where: { eventId: id }, orderBy: { createdAt: "asc" } });
    return NextResponse.json(items);
  });
}
