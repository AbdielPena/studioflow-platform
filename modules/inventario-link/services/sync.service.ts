import { prisma } from "@/packages/db";
import { Prisma, InventoryJobType, InventoryJobStatus } from "@prisma/client";
import { getAdapter } from "../adapters/factory";
import { moduleLogger } from "@/lib/logger";

const log = moduleLogger("inventario-link/sync");

// ============================================================================
// Service de sincronización con inventario externo.
// Punto único de entrada para reserve / commit / release / queryStock.
// ============================================================================

export async function enqueueJob(opts: {
  companyId: string;
  connectionId: string;
  jobType: InventoryJobType;
  payload: Record<string, unknown>;
  invoiceId?: string;
}): Promise<string> {
  const job = await prisma.pendingInventorySyncJob.create({
    data: {
      companyId: opts.companyId,
      connectionId: opts.connectionId,
      jobType: opts.jobType,
      payload: opts.payload as Prisma.InputJsonValue,
      invoiceId: opts.invoiceId,
      status: InventoryJobStatus.QUEUED,
    },
  });
  log.info({ jobId: job.id, type: opts.jobType }, "Job enqueued");
  return job.id;
}

export async function runJob(jobId: string): Promise<void> {
  const job = await prisma.pendingInventorySyncJob.findUnique({
    where: { id: jobId },
    include: { connection: true },
  });
  if (!job) return;
  if (job.status !== InventoryJobStatus.QUEUED && job.status !== InventoryJobStatus.RETRYING) {
    log.warn({ jobId, status: job.status }, "Skipping job, not in runnable state");
    return;
  }

  await prisma.pendingInventorySyncJob.update({
    where: { id: jobId },
    data: { status: InventoryJobStatus.RUNNING, startedAt: new Date(), attempts: { increment: 1 } },
  });

  const adapter = getAdapter(job.connection);
  const start = Date.now();

  try {
    const payload = job.payload as Record<string, unknown>;
    let result;
    switch (job.jobType) {
      case InventoryJobType.RESERVE:
        result = await adapter.reserve(payload as never);
        break;
      case InventoryJobType.COMMIT:
        result = await adapter.commit(payload as never);
        break;
      case InventoryJobType.RELEASE:
        result = await adapter.release(payload as never);
        break;
      case InventoryJobType.STOCK_QUERY:
        result = await adapter.queryStock((payload as { items: never[] }).items);
        break;
      default:
        throw new Error(`Job type ${job.jobType} not implemented yet`);
    }

    if (result.ok) {
      await prisma.$transaction([
        prisma.pendingInventorySyncJob.update({
          where: { id: jobId },
          data: { status: InventoryJobStatus.SUCCEEDED, completedAt: new Date() },
        }),
        prisma.externalInventorySyncLog.create({
          data: {
            companyId: job.companyId,
            connectionId: job.connectionId,
            jobId: job.id,
            jobType: job.jobType,
            status: InventoryJobStatus.SUCCEEDED,
            requestPayload: job.payload as Prisma.InputJsonValue,
            responsePayload: (result.raw as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            durationMs: result.durationMs,
            invoiceId: job.invoiceId,
          },
        }),
      ]);
      log.info({ jobId, durationMs: result.durationMs }, "Job succeeded");
      return;
    }

    const retryable = result.error.retryable && job.attempts < job.maxAttempts;
    const newStatus = retryable
      ? InventoryJobStatus.RETRYING
      : InventoryJobStatus.DEAD_LETTER;

    await prisma.$transaction([
      prisma.pendingInventorySyncJob.update({
        where: { id: jobId },
        data: {
          status: newStatus,
          lastError: result.error.message,
          nextAttemptAt: retryable
            ? new Date(Date.now() + Math.pow(2, job.attempts) * 30_000)
            : null,
        },
      }),
      prisma.externalInventorySyncLog.create({
        data: {
          companyId: job.companyId,
          connectionId: job.connectionId,
          jobId: job.id,
          jobType: job.jobType,
          status: newStatus,
          requestPayload: job.payload as Prisma.InputJsonValue,
          responsePayload: (result.raw as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          errorMessage: result.error.message,
          durationMs: result.durationMs,
          invoiceId: job.invoiceId,
        },
      }),
    ]);
    log.warn({ jobId, error: result.error, retryable }, "Job failed");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.pendingInventorySyncJob.update({
      where: { id: jobId },
      data: {
        status: InventoryJobStatus.FAILED,
        lastError: message,
      },
    });
    log.error({ err, jobId, durationMs: Date.now() - start }, "Job threw");
  }
}
