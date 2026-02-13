export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logError } from "@/lib/logger";

/**
 * API route to get emissions summary for an installation data
 * Used by the Declaration Wizard
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tenantId = (session.user as any).tenantId as string;

    // Verify installation data belongs to this tenant
    const installationData = await prisma.installationData.findUnique({
      where: { id },
      select: { tenantId: true },
    });
    if (!installationData || installationData.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const emissions = await prisma.emission.findMany({
      where: { installationDataId: id },
      include: {
        emissionType: true,
        emissionMethod: true,
      },
    });

    const result = emissions.map((e) => ({
      id: e.id,
      sourceStream: e.sourceStreamName || "-",
      type: e.emissionType?.name || "-",
      method: e.emissionMethod?.name || "-",
      co2eFossil: e.co2eFossil ? Number(e.co2eFossil) : 0,
      co2eBio: e.co2eBio ? Number(e.co2eBio) : 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    logError("api.installationData.emissions", error);
    return NextResponse.json(
      { error: "Failed to load emissions" },
      { status: 500 }
    );
  }
}
