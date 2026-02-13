export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/logger";

const DOTNET_SERVICE_URL = process.env.DOTNET_SERVICE_URL || "http://localhost:5100";

/**
 * Proxy route for PDF report generation
 * Forwards to .NET 9 microservice with QuestPDF
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportType: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tenantId = (session.user as any).tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: "No tenant context" }, { status: 403 });
    }

    const { reportType } = await params;
    const body = await request.json();

    const response = await fetch(
      `${DOTNET_SERVICE_URL}/api/v1/reports/pdf/${reportType}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...body,
          tenantId,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      try {
        return NextResponse.json(JSON.parse(errorText), { status: response.status });
      } catch {
        return NextResponse.json({ error: errorText }, { status: response.status });
      }
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition");
    const fileName = contentDisposition?.match(/filename="?([^"]+)"?/)?.[1]
      || `CBAM_${reportType}_report.pdf`;

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set("Content-Disposition", `attachment; filename="${fileName}"`);

    return new NextResponse(blob, { headers });
  } catch (error) {
    logError("api.reports.pdf", error);
    return NextResponse.json(
      { error: "PDF report generation failed" },
      { status: 500 }
    );
  }
}
