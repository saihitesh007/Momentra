import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";

type Params = { params: Promise<{ id: string }> };

// GET /api/events/[id]/budget
export async function GET(_req: Request, { params }: Params) {
  const routeParams = await params;
  const items = await prisma.budgetItem.findMany({
    where: { eventId: routeParams.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(items);
}



