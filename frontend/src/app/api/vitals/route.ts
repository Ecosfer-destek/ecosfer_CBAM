export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";

// Store recent vitals in memory for monitoring
const vitalsBuffer: Array<{
  name: string;
  value: number;
  rating: string;
  timestamp: number;
}> = [];

const MAX_BUFFER_SIZE = 1000;

export async function POST(request: Request) {
  try {
    const vital = await request.json();

    vitalsBuffer.push({
      name: vital.name,
      value: vital.value,
      rating: vital.rating,
      timestamp: vital.timestamp || Date.now(),
    });

    // Keep buffer manageable
    if (vitalsBuffer.length > MAX_BUFFER_SIZE) {
      vitalsBuffer.splice(0, vitalsBuffer.length - MAX_BUFFER_SIZE);
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
}

// GET endpoint for monitoring
export async function GET() {
  const now = Date.now();
  const fiveMinAgo = now - 5 * 60 * 1000;
  const recent = vitalsBuffer.filter((v) => v.timestamp > fiveMinAgo);

  const summary: Record<string, { count: number; avg: number; p75: number; good: number; poor: number }> = {};

  for (const vital of recent) {
    if (!summary[vital.name]) {
      summary[vital.name] = { count: 0, avg: 0, p75: 0, good: 0, poor: 0 };
    }
    summary[vital.name].count++;
    summary[vital.name].avg += vital.value;
    if (vital.rating === "good") summary[vital.name].good++;
    if (vital.rating === "poor") summary[vital.name].poor++;
  }

  for (const name of Object.keys(summary)) {
    const s = summary[name];
    s.avg = s.count > 0 ? s.avg / s.count : 0;

    // Calculate p75
    const values = recent.filter((v) => v.name === name).map((v) => v.value).sort((a, b) => a - b);
    const p75Index = Math.ceil(values.length * 0.75) - 1;
    s.p75 = values[p75Index] || 0;
  }

  return NextResponse.json({
    period: "5m",
    total_reports: recent.length,
    vitals: summary,
  });
}
