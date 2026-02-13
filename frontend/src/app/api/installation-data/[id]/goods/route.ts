export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logError } from "@/lib/logger";

/**
 * API route to get goods categories for an installation data
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

    const goods = await prisma.installationGoodsCategoryAndRoute.findMany({
      where: { installationDataId: id },
      include: {
        goodsCategory: {
          include: {
            cnCodes: { take: 1 },
          },
        },
      },
    });

    const result = goods.map((g) => ({
      id: g.id,
      categoryName: g.goodsCategory?.name || "-",
      cnCode: g.goodsCategory?.cnCodes?.[0]?.code || "",
      routeType: g.routeType,
      routes: [g.route1, g.route2, g.route3, g.route4, g.route5, g.route6]
        .filter(Boolean)
        .join(", "),
    }));

    return NextResponse.json(result);
  } catch (error) {
    logError("api.installationData.goods", error);
    return NextResponse.json(
      { error: "Failed to load goods" },
      { status: 500 }
    );
  }
}
