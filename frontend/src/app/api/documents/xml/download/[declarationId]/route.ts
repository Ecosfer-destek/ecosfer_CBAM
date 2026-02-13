export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/logger";

const DOTNET_SERVICE_URL = process.env.DOTNET_SERVICE_URL || "http://localhost:5100";

/**
 * Proxy route for XML file download
 * Forwards to .NET 9 microservice, streams XML file back
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ declarationId: string }> }
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

    const { declarationId } = await params;

    const response = await fetch(
      `${DOTNET_SERVICE_URL}/api/v1/xml/download/${declarationId}`,
      {
        headers: {
          "X-Tenant-Id": tenantId,
        },
      }
    );

    if (!response.ok) {
      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    }

    const blob = await response.blob();
    const headers = new Headers();
    headers.set("Content-Type", "application/xml");
    headers.set(
      "Content-Disposition",
      `attachment; filename="CBAM_Declaration_${declarationId}.xml"`
    );

    return new NextResponse(blob, { headers });
  } catch (error) {
    logError("api.documents.xml.download", error);
    return NextResponse.json(
      { error: "XML download failed" },
      { status: 500 }
    );
  }
}
