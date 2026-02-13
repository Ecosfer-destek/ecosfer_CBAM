export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/logger";

const DOTNET_SERVICE_URL = process.env.DOTNET_SERVICE_URL || "http://localhost:5100";

/**
 * Proxy route for Excel import
 * Forwards multipart/form-data to .NET 9 microservice
 * Adds tenantId from authenticated session
 */
export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const installationDataId = formData.get("installationDataId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!installationDataId) {
      return NextResponse.json(
        { error: "installationDataId is required" },
        { status: 400 }
      );
    }

    // Forward to .NET service with tenantId injected
    const proxyFormData = new FormData();
    proxyFormData.append("file", file);
    proxyFormData.append("installationDataId", installationDataId);
    proxyFormData.append("tenantId", tenantId);

    const response = await fetch(`${DOTNET_SERVICE_URL}/api/v1/excel/import`, {
      method: "POST",
      body: proxyFormData,
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    logError("api.documents.excel.import", error);
    return NextResponse.json(
      { error: "Excel import failed" },
      { status: 500 }
    );
  }
}
