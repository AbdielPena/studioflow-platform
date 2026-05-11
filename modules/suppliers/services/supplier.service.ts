import { AuditAction } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { isValidDocumentNumber } from "@/lib/fiscal";
import * as repo from "../repositories/supplier.repository";
import type { SupplierFormInput } from "../schemas/supplier.schema";

export const listSuppliersService = (companyId: string, query?: string) =>
  repo.listSuppliers({ companyId, query });

export async function getSupplierService(companyId: string, id: string) {
  const s = await repo.findSupplier({ companyId, id });
  if (!s) throw new AppError({ code: "NOT_FOUND", message: "Suplidor no encontrado" });
  return s;
}

function validateDoc(doc: string | null | undefined) {
  if (doc && !isValidDocumentNumber(doc)) {
    throw new AppError({ code: "VALIDATION_ERROR", message: "RNC debe tener 9 u 11 dígitos" });
  }
}

export async function createSupplierService(opts: {
  companyId: string;
  userId: string;
  data: SupplierFormInput;
}) {
  validateDoc(opts.data.documentNumber);
  const s = await repo.createSupplier({ companyId: opts.companyId, data: opts.data });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.CREATE,
    module: "suppliers",
    entityType: "Supplier",
    entityId: s.id,
    after: { legalName: s.legalName },
  });
  return s;
}

export async function updateSupplierService(opts: {
  companyId: string;
  userId: string;
  id: string;
  data: SupplierFormInput;
}) {
  const before = await repo.findSupplier({ companyId: opts.companyId, id: opts.id });
  if (!before) throw new AppError({ code: "NOT_FOUND", message: "Suplidor no encontrado" });
  validateDoc(opts.data.documentNumber);
  const after = await repo.updateSupplier({
    companyId: opts.companyId,
    id: opts.id,
    data: opts.data,
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.UPDATE,
    module: "suppliers",
    entityType: "Supplier",
    entityId: opts.id,
    before: { legalName: before.legalName },
    after: { legalName: after.legalName },
  });
  return after;
}

export async function deleteSupplierService(opts: {
  companyId: string;
  userId: string;
  id: string;
}) {
  await repo.softDeleteSupplier({ companyId: opts.companyId, id: opts.id });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.DELETE,
    module: "suppliers",
    entityType: "Supplier",
    entityId: opts.id,
  });
}
