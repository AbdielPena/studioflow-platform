import { AuditAction, NcfStatus, type NcfType } from "@prisma/client";
import { prisma } from "@/packages/db";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { formatNcf } from "@/lib/fiscal";
import type { NcfSequenceFormInput } from "../schemas";

export const listNcfSequencesService = (companyId: string) =>
  prisma.ncfSequence.findMany({
    where: { companyId, deletedAt: null },
    include: { branch: true },
    orderBy: [{ type: "asc" }, { rangeFrom: "asc" }],
  });

export async function getNcfSequenceService(companyId: string, id: string) {
  const n = await prisma.ncfSequence.findFirst({
    where: { id, companyId, deletedAt: null },
    include: { branch: true },
  });
  if (!n) throw new AppError({ code: "NOT_FOUND", message: "Secuencia NCF no encontrada" });
  return n;
}

export async function createNcfSequenceService(opts: {
  companyId: string;
  userId: string;
  data: NcfSequenceFormInput;
}) {
  const overlap = await prisma.ncfSequence.findFirst({
    where: {
      companyId: opts.companyId,
      type: opts.data.type as NcfType,
      branchId: opts.data.branchId ?? null,
      deletedAt: null,
      OR: [
        {
          rangeFrom: { lte: opts.data.rangeFrom },
          rangeTo: { gte: opts.data.rangeFrom },
        },
        {
          rangeFrom: { lte: opts.data.rangeTo },
          rangeTo: { gte: opts.data.rangeTo },
        },
        {
          rangeFrom: { gte: opts.data.rangeFrom },
          rangeTo: { lte: opts.data.rangeTo },
        },
      ],
    },
  });
  if (overlap) {
    throw new AppError({
      code: "CONFLICT",
      message: `Rango se solapa con secuencia existente (${formatNcf(overlap.prefix, overlap.rangeFrom)}-${formatNcf(overlap.prefix, overlap.rangeTo)})`,
    });
  }
  const seq = await prisma.ncfSequence.create({
    data: {
      companyId: opts.companyId,
      type: opts.data.type as NcfType,
      branchId: opts.data.branchId ?? null,
      prefix: opts.data.type,
      rangeFrom: opts.data.rangeFrom,
      rangeTo: opts.data.rangeTo,
      currentValue: opts.data.rangeFrom - 1,
      expiresAt: opts.data.expiresAt ?? null,
      notes: opts.data.notes || null,
      status: NcfStatus.ACTIVE,
    },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.CREATE,
    module: "settings",
    entityType: "NcfSequence",
    entityId: seq.id,
    after: { type: seq.type, range: `${seq.rangeFrom}-${seq.rangeTo}` },
  });
  return seq;
}

export async function updateNcfSequenceService(opts: {
  companyId: string;
  userId: string;
  id: string;
  data: { expiresAt?: Date | null; notes?: string | null; status?: NcfStatus };
}) {
  await getNcfSequenceService(opts.companyId, opts.id);
  const updated = await prisma.ncfSequence.update({
    where: { id: opts.id },
    data: {
      expiresAt: opts.data.expiresAt ?? undefined,
      notes: opts.data.notes ?? undefined,
      status: opts.data.status ?? undefined,
    },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.UPDATE,
    module: "settings",
    entityType: "NcfSequence",
    entityId: opts.id,
  });
  return updated;
}

export async function deleteNcfSequenceService(opts: {
  companyId: string;
  userId: string;
  id: string;
}) {
  const seq = await getNcfSequenceService(opts.companyId, opts.id);
  if (seq.currentValue >= seq.rangeFrom) {
    throw new AppError({
      code: "PRECONDITION_FAILED",
      message: "No se puede eliminar una secuencia que ya emitió comprobantes. Pausarla en su lugar.",
    });
  }
  await prisma.ncfSequence.update({
    where: { id: opts.id },
    data: { deletedAt: new Date() },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.DELETE,
    module: "settings",
    entityType: "NcfSequence",
    entityId: opts.id,
  });
}
