import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";
import { UpdateVendorSchema } from "@/backend/lib/schemas";
import { handleRoute } from "@/backend/lib/api";

type Params = { params: Promise<{ id: string; vendorId: string }> };

/** Updates a vendor row scoped to its parent event. */
export async function PATCH(req: Request, { params }: Params): Promise<Response> {
  return handleRoute(async () => {
    const { id, vendorId } = await params;
    const data = UpdateVendorSchema.parse(await req.json());
    const vendor = await prisma.vendorItem.update({ where: { id: vendorId, eventId: id }, data: { ...data, aiGenerated: false } });
    return NextResponse.json(vendor);
  });
}
