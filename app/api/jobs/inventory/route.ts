import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/packages/db";
import { runJob } from "@/modules/inventario-link/services/sync.service";
import { moduleLogger } from "@/packages/lib/logger";

const log = moduleLogger("api/jobs/inventory");

// ============================================================================
// Worker endpoint para procesar jobs de inventario externo.
// Llamado por:
// - Supabase pg_cron cada minuto
// - Manualmente desde dashboard
// - Vercel cron (vercel.json)
//
// Auth: header X-Cron-Secret = process.env.CRON_SECRET
// ============================================================================

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const runnable = await prisma.pendingInventorySyncJob.findMany({
    where: {
      status: { in: ["QUEUED", "RETRYING"] },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
    },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  log.info({ count: runnable.length }, "Processing inventory jobs");

  const results = await Promise.allSettled(runnable.map((j) => runJob(j.id)));
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({
    processed: runnable.length,
    succeeded: results.length - failed,
    failed,
  });
}

export async function GET() {
  const counts = await prisma.pendingInventorySyncJob.groupBy({
    by: ["status"],
    _count: true,
  });
  return NextResponse.json({
    summary: counts.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = c._count;
      return acc;
    }, {}),
  });
}
