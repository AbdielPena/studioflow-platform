import { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/packages/db";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { getAdapter } from "../adapters/factory";
import type { ConnectionFormInput } from "../schemas/connection.schema";

export const listConnectionsService = (companyId: string) =>
  prisma.externalInventoryConnection.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

export const getActiveConnectionService = (companyId: string) =>
  prisma.externalInventoryConnection.findFirst({
    where: { companyId, isActive: true, deletedAt: null },
  });

export async function getConnectionService(companyId: string, id: string) {
  const c = await prisma.externalInventoryConnection.findFirst({
    where: { id, companyId, deletedAt: null },
  });
  if (!c) throw new AppError({ code: "NOT_FOUND", message: "Conexión no encontrada" });
  return c;
}

export async function upsertConnectionService(opts: {
  companyId: string;
  userId: string;
  id?: string;
  data: ConnectionFormInput;
}) {
  const data = {
    name: opts.data.name,
    baseUrl: opts.data.baseUrl,
    authType: opts.data.authType,
    authToken: opts.data.authToken || null,
    apiKey: opts.data.apiKey || null,
    customHeaders: (opts.data.customHeaders as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    endpoints: (opts.data.endpoints as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    timeoutMs: opts.data.timeoutMs,
    maxRetries: opts.data.maxRetries,
    manualMode: opts.data.manualMode,
    isActive: opts.data.isActive,
  };

  const c = opts.id
    ? await prisma.externalInventoryConnection.update({
        where: { id: opts.id },
        data,
      })
    : await prisma.externalInventoryConnection.create({
        data: { ...data, companyId: opts.companyId },
      });

  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: opts.id ? AuditAction.UPDATE : AuditAction.CREATE,
    module: "inventario-link",
    entityType: "ExternalInventoryConnection",
    entityId: c.id,
    after: { name: c.name, baseUrl: c.baseUrl },
  });
  return c;
}

export async function deleteConnectionService(opts: {
  companyId: string;
  userId: string;
  id: string;
}) {
  await prisma.externalInventoryConnection.update({
    where: { id: opts.id },
    data: { deletedAt: new Date(), isActive: false },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.DELETE,
    module: "inventario-link",
    entityType: "ExternalInventoryConnection",
    entityId: opts.id,
  });
}

export async function testConnectionService(opts: { companyId: string; id: string }) {
  const c = await getConnectionService(opts.companyId, opts.id);
  const adapter = getAdapter(c);
  const result = await adapter.healthCheck();

  await prisma.externalInventoryConnection.update({
    where: { id: opts.id },
    data: {
      lastHealthCheckAt: new Date(),
      lastHealthOk: result.ok,
    },
  });

  return {
    ok: result.ok,
    durationMs: result.durationMs,
    error: result.ok ? null : result.error.message,
  };
}

export const listRecentSyncLogsService = (companyId: string, take = 100) =>
  prisma.externalInventorySyncLog.findMany({
    where: { companyId },
    include: { connection: true },
    orderBy: { createdAt: "desc" },
    take,
  });

export const listPendingJobsService = (companyId: string, take = 100) =>
  prisma.pendingInventorySyncJob.findMany({
    where: { companyId, status: { in: ["QUEUED", "RUNNING", "RETRYING", "FAILED", "DEAD_LETTER"] } },
    include: { connection: true },
    orderBy: { createdAt: "desc" },
    take,
  });
