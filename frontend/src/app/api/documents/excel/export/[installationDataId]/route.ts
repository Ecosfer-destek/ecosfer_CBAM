export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/logger";

const DOTNET_SERVICE_URL = process.env.DOTNET_SERVICE_URL || "http://localhost:5100";

/**
 * Proxy route for Excel export
 * Forwards to .NET 9 microservice and streams the Excel file back
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ installationDataId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { installationDataId } = await params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tenantId = (session.user as any).tenantId;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID not found in session" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${DOTNET_SERVICE_URL}/api/v1/excel/export/${installationDataId}`,
      {
        headers: {
          "X-Tenant-Id": tenantId,
        },
      }
    );

    if (!response.ok) {
      // Try to parse JSON error response from the .NET service
      const contentType = response.headers.get("content-type") || "";
      if (
        contentType.includes("application/json") ||
        contentType.includes("application/problem+json")
      ) {
        const result = await response.json();
        return NextResponse.json(result, { status: response.status });
      }
      return NextResponse.json(
        { error: `Export failed with status ${response.status}` },
        { status: response.status }
      );
    }

    // Stream the Excel file back to the client
    const blob = await response.arrayBuffer();
    const fileName =
      response.headers
        .get("content-disposition")
        ?.split("filename=")[1]
        ?.replace(/"/g, "") ||
      `CBAM_Export_${installationDataId}.xlsx`;

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": blob.byteLength.toString(),
      },
    });
  } catch (error) {
    logError("api.documents.excel.export", error);
    return NextResponse.json(
      { error: "Excel export failed" },
      { status: 500 }
    );
  }
}
