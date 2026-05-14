import { NextResponse } from "next/server";
import { prisma } from "@/packages/db";

/**
 * GET /api/healthz — liveness + readiness check.
 * Public, sin auth. Devuelve 200 si DB responde, 503 si no.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const startedAt = Date.now();
  const ts = new Date().toISOString();

  let dbStatus: "ok" | "fail" = "fail";
  let dbError: string | undefined;
  let dbLatencyMs: number | undefined;

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
    dbStatus = "ok";
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(
    {
      ok: dbStatus === "ok",
      service: "studioflow-platform",
      db: dbStatus,
      db_latency_ms: dbLatencyMs,
      db_error: dbError,
      uptime_s: process.uptime ? Math.round(process.uptime()) : null,
      response_time_ms: Date.now() - startedAt,
      ts,
    },
    {
      status: dbStatus === "ok" ? 200 : 503,
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
    },
  );
}
