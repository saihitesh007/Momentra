import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";

type Params = { params: { id: string } };

// GET /api/events/[id]/budget
export async function GET(_req: Request, { params }: Params) {
  const items = await prisma.budgetItem.findMany({
    where: { eventId: params.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(items);
}


