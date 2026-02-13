export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";

// Simple metrics counter (in-memory, resets on restart)
const metrics = {
  requests_total: 0,
  errors_total: 0,
  start_time: Date.now(),
};

// Exported for middleware usage
export function incrementRequests() {
  metrics.requests_total++;
}

export function incrementErrors() {
  metrics.errors_total++;
}

export async function GET() {
  const uptimeSeconds = Math.floor((Date.now() - metrics.start_time) / 1000);

  // Prometheus exposition format
  const lines = [
    "# HELP frontend_requests_total Total frontend requests",
    "# TYPE frontend_requests_total counter",
    `frontend_requests_total ${metrics.requests_total}`,
    "",
    "# HELP frontend_errors_total Total frontend errors",
    "# TYPE frontend_errors_total counter",
    `frontend_errors_total ${metrics.errors_total}`,
    "",
    "# HELP frontend_uptime_seconds Frontend uptime in seconds",
    "# TYPE frontend_uptime_seconds gauge",
    `frontend_uptime_seconds ${uptimeSeconds}`,
    "",
    "# HELP frontend_info Frontend service info",
    "# TYPE frontend_info gauge",
    `frontend_info{version="2.0.0",service="ecosfer-frontend"} 1`,
    "",
    "# HELP nodejs_heap_size_bytes Node.js heap size",
    "# TYPE nodejs_heap_size_bytes gauge",
    `nodejs_heap_size_bytes{type="used"} ${process.memoryUsage().heapUsed}`,
    `nodejs_heap_size_bytes{type="total"} ${process.memoryUsage().heapTotal}`,
    `nodejs_heap_size_bytes{type="rss"} ${process.memoryUsage().rss}`,
    "",
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
    },
  });
}
