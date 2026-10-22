import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";

type Params = { params: { id: string } };

// GET /api/events/[id]/vendors
export async function GET(_req: Request, { params }: Params) {
  const vendors = await prisma.vendorItem.findMany({
    where: { eventId: params.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(vendors);
}


