import { Prisma, type AuditAction } from "@prisma/client";
import { prisma } from "@/packages/db";
import { moduleLogger } from "./logger";

const log = moduleLogger("audit");

export type AuditInput = {
  companyId?: string | null;
  userId?: string | null;
  action: AuditAction;
  module: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: input.companyId ?? null,
        userId: input.userId ?? null,
        action: input.action,
        module: input.module,
        entityType: input.entityType,
        entityId: input.entityId,
        before: (input.before as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        after: (input.after as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        metadata: (input.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (err) {
    log.error({ err, input }, "Failed to write audit log");
  }
}
