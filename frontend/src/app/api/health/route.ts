export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";

const startTime = Date.now();

export async function GET() {
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  return NextResponse.json({
    status: "healthy",
    service: "ecosfer-frontend",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    uptime: `${uptime}s`,
    environment: process.env.NODE_ENV,
  });
}
