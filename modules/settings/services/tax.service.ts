import { AuditAction } from "@prisma/client";
import { prisma } from "@/packages/db";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import type { TaxConfigFormInput } from "../schemas";

export const listTaxesService = (companyId: string) =>
  prisma.taxConfig.findMany({
    where: { companyId },
    orderBy: { key: "asc" },
  });

export async function getTaxService(companyId: string, id: string) {
  const t = await prisma.taxConfig.findFirst({ where: { id, companyId } });
  if (!t) throw new AppError({ code: "NOT_FOUND", message: "Impuesto no encontrado" });
  return t;
}

export async function upsertTaxService(opts: {
  companyId: string;
  userId: string;
  data: TaxConfigFormInput;
}) {
  const t = await prisma.taxConfig.upsert({
    where: { companyId_key: { companyId: opts.companyId, key: opts.data.key } },
    update: {
      name: opts.data.name,
      rate: opts.data.rate,
      isWithholding: opts.data.isWithholding,
      isActive: opts.data.isActive,
    },
    create: {
      companyId: opts.companyId,
      key: opts.data.key,
      name: opts.data.name,
      rate: opts.data.rate,
      isWithholding: opts.data.isWithholding,
      isActive: opts.data.isActive,
    },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.UPDATE,
    module: "settings",
    entityType: "TaxConfig",
    entityId: t.id,
    after: { key: t.key, rate: t.rate.toString() },
  });
  return t;
}

export async function deleteTaxService(opts: {
  companyId: string;
  userId: string;
  id: string;
}) {
  await prisma.taxConfig.delete({ where: { id: opts.id } });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.DELETE,
    module: "settings",
    entityType: "TaxConfig",
    entityId: opts.id,
  });
}
