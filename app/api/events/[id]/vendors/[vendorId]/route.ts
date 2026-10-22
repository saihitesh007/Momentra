import { NextResponse } from "next/server";
import { prisma } from "@/backend/lib/db";
import { UpdateVendorSchema } from "@/backend/lib/schemas";
import { ZodError } from "zod";

type Params = { params: { id: string; vendorId: string } };

// PATCH /api/events/[id]/vendors/[vendorId]
export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    const data = UpdateVendorSchema.parse(body);

    const vendor = await prisma.vendorItem.update({
      where: { id: params.vendorId, eventId: params.id },
      data: { ...data, aiGenerated: false },
    });
    return NextResponse.json(vendor);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Validation error", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}


