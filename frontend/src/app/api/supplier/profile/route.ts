export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find supplier linked to this user
  const supplier = await prisma.supplier.findFirst({
    where: { userId: session.user.id },
    include: { country: true },
  });

  if (!supplier) {
    return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
  }

  return NextResponse.json(supplier);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supplier = await prisma.supplier.findFirst({
    where: { userId: session.user.id },
  });

  if (!supplier) {
    return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
  }

  const body = await req.json();

  await prisma.supplier.update({
    where: { id: supplier.id },
    data: {
      name: body.name || supplier.name,
      email: body.email ?? supplier.email,
      phone: body.phone ?? supplier.phone,
      address: body.address ?? supplier.address,
      contactPerson: body.contactPerson ?? supplier.contactPerson,
      taxNumber: body.taxNumber ?? supplier.taxNumber,
      taxOffice: body.taxOffice ?? supplier.taxOffice,
    },
  });

  return NextResponse.json({ success: true });
}
