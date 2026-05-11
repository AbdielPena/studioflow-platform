import { AuditAction } from "@prisma/client";
import { prisma } from "@/packages/db";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import type { BranchFormInput } from "../schemas";

export const listBranchesService = (companyId: string) =>
  prisma.branch.findMany({
    where: { companyId, deletedAt: null },
    orderBy: [{ isMain: "desc" }, { name: "asc" }],
  });

export async function getBranchService(companyId: string, id: string) {
  const b = await prisma.branch.findFirst({
    where: { id, companyId, deletedAt: null },
  });
  if (!b) throw new AppError({ code: "NOT_FOUND", message: "Sucursal no encontrada" });
  return b;
}

export async function createBranchService(opts: {
  companyId: string;
  userId: string;
  data: BranchFormInput;
}) {
  const b = await prisma.$transaction(async (tx) => {
    if (opts.data.isMain) {
      await tx.branch.updateMany({
        where: { companyId: opts.companyId, isMain: true },
        data: { isMain: false },
      });
    }
    return tx.branch.create({
      data: {
        companyId: opts.companyId,
        code: opts.data.code.toUpperCase(),
        name: opts.data.name,
        address: opts.data.address || null,
        phone: opts.data.phone || null,
        isMain: opts.data.isMain,
        isActive: opts.data.isActive,
      },
    });
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.CREATE,
    module: "settings",
    entityType: "Branch",
    entityId: b.id,
    after: { code: b.code, name: b.name },
  });
  return b;
}

export async function updateBranchService(opts: {
  companyId: string;
  userId: string;
  id: string;
  data: BranchFormInput;
}) {
  const before = await getBranchService(opts.companyId, opts.id);
  const after = await prisma.$transaction(async (tx) => {
    if (opts.data.isMain && !before.isMain) {
      await tx.branch.updateMany({
        where: { companyId: opts.companyId, isMain: true },
        data: { isMain: false },
      });
    }
    return tx.branch.update({
      where: { id: opts.id },
      data: {
        code: opts.data.code.toUpperCase(),
        name: opts.data.name,
        address: opts.data.address || null,
        phone: opts.data.phone || null,
        isMain: opts.data.isMain,
        isActive: opts.data.isActive,
      },
    });
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.UPDATE,
    module: "settings",
    entityType: "Branch",
    entityId: opts.id,
    before: { name: before.name },
    after: { name: after.name },
  });
  return after;
}

export async function deleteBranchService(opts: {
  companyId: string;
  userId: string;
  id: string;
}) {
  const before = await getBranchService(opts.companyId, opts.id);
  if (before.isMain) {
    throw new AppError({
      code: "PRECONDITION_FAILED",
      message: "No puedes eliminar la sucursal principal",
    });
  }
  await prisma.branch.update({
    where: { id: opts.id },
    data: { deletedAt: new Date(), isActive: false },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.DELETE,
    module: "settings",
    entityType: "Branch",
    entityId: opts.id,
    before: { name: before.name },
  });
}
