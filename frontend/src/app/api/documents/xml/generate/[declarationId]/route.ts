export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/logger";

const DOTNET_SERVICE_URL = process.env.DOTNET_SERVICE_URL || "http://localhost:5100";

/**
 * Proxy route for XML generation
 * Forwards to .NET 9 microservice with tenant context
 */
export async function POST(
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
      `${DOTNET_SERVICE_URL}/api/v1/xml/generate/${declarationId}`,
      {
        method: "POST",
        headers: {
          "X-Tenant-Id": tenantId,
        },
      }
    );

    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    logError("api.documents.xml.generate", error);
    return NextResponse.json(
      { error: "XML generation failed" },
      { status: 500 }
    );
  }
}
