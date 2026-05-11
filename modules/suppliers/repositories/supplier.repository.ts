import { prisma, Prisma } from "@/packages/db";
import type { SupplierFormInput } from "../schemas/supplier.schema";

export async function listSuppliers(opts: { companyId: string; query?: string }) {
  const where: Prisma.SupplierWhereInput = {
    companyId: opts.companyId,
    deletedAt: null,
  };
  if (opts.query) {
    where.OR = [
      { legalName: { contains: opts.query, mode: "insensitive" } },
      { tradeName: { contains: opts.query, mode: "insensitive" } },
      { documentNumber: { contains: opts.query } },
    ];
  }
  return prisma.supplier.findMany({
    where,
    orderBy: { legalName: "asc" },
    take: 500,
  });
}

export async function findSupplier(opts: { companyId: string; id: string }) {
  return prisma.supplier.findFirst({
    where: { id: opts.id, companyId: opts.companyId, deletedAt: null },
  });
}

export async function createSupplier(opts: { companyId: string; data: SupplierFormInput }) {
  const d = opts.data;
  return prisma.supplier.create({
    data: {
      companyId: opts.companyId,
      code: d.code || null,
      legalName: d.legalName,
      tradeName: d.tradeName || null,
      documentNumber: d.documentNumber || null,
      email: d.email || null,
      phone: d.phone || null,
      address: d.address || null,
      paymentTerms: d.paymentTerms,
      status: d.status,
      notes: d.notes || null,
    },
  });
}

export async function updateSupplier(opts: {
  companyId: string;
  id: string;
  data: SupplierFormInput;
}) {
  const d = opts.data;
  return prisma.supplier.update({
    where: { id: opts.id },
    data: {
      code: d.code || null,
      legalName: d.legalName,
      tradeName: d.tradeName || null,
      documentNumber: d.documentNumber || null,
      email: d.email || null,
      phone: d.phone || null,
      address: d.address || null,
      paymentTerms: d.paymentTerms,
      status: d.status,
      notes: d.notes || null,
    },
  });
}

export async function softDeleteSupplier(opts: { companyId: string; id: string }) {
  return prisma.supplier.update({
    where: { id: opts.id },
    data: { deletedAt: new Date(), status: "INACTIVE" },
  });
}
