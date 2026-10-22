import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";

type Params = { params: Promise<{ id: string }> };

// GET /api/events/[id]/vendors
export async function GET(_req: Request, { params }: Params) {
  const routeParams = await params;
  const vendors = await prisma.vendorItem.findMany({
    where: { eventId: routeParams.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(vendors);
}



