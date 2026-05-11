import { prisma, Prisma } from "@/packages/db";
import type { CustomerFormInput, CustomerListFilters } from "../schemas/customer.schema";

export async function listCustomers(opts: {
  companyId: string;
  filters?: CustomerListFilters;
  take?: number;
}) {
  const where: Prisma.CustomerWhereInput = {
    companyId: opts.companyId,
    deletedAt: null,
  };
  if (opts.filters?.type) where.type = opts.filters.type;
  if (typeof opts.filters?.isActive === "boolean") where.isActive = opts.filters.isActive;
  if (opts.filters?.query) {
    const q = opts.filters.query;
    where.OR = [
      { legalName: { contains: q, mode: "insensitive" } },
      { tradeName: { contains: q, mode: "insensitive" } },
      { documentNumber: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  return prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts.take ?? 200,
  });
}

export async function findCustomer(opts: { companyId: string; id: string }) {
  return prisma.customer.findFirst({
    where: { id: opts.id, companyId: opts.companyId, deletedAt: null },
  });
}

export async function createCustomer(opts: { companyId: string; data: CustomerFormInput }) {
  const d = opts.data;
  return prisma.customer.create({
    data: {
      companyId: opts.companyId,
      code: d.code || null,
      type: d.type,
      legalName: d.legalName,
      tradeName: d.tradeName || null,
      documentNumber: d.documentNumber || null,
      email: d.email || null,
      phone: d.phone || null,
      mobile: d.mobile || null,
      address: d.address || null,
      city: d.city || null,
      country: d.country,
      creditLimit: new Prisma.Decimal(d.creditLimit),
      notes: d.notes || null,
      tags: d.tags,
      isActive: d.isActive,
    },
  });
}

export async function updateCustomer(opts: {
  companyId: string;
  id: string;
  data: CustomerFormInput;
}) {
  const d = opts.data;
  return prisma.customer.update({
    where: { id: opts.id },
    data: {
      code: d.code || null,
      type: d.type,
      legalName: d.legalName,
      tradeName: d.tradeName || null,
      documentNumber: d.documentNumber || null,
      email: d.email || null,
      phone: d.phone || null,
      mobile: d.mobile || null,
      address: d.address || null,
      city: d.city || null,
      country: d.country,
      creditLimit: new Prisma.Decimal(d.creditLimit),
      notes: d.notes || null,
      tags: d.tags,
      isActive: d.isActive,
    },
  });
}

export async function softDeleteCustomer(opts: { companyId: string; id: string }) {
  return prisma.customer.update({
    where: { id: opts.id },
    data: { deletedAt: new Date(), isActive: false },
  });
}

export async function countCustomers(companyId: string): Promise<number> {
  return prisma.customer.count({ where: { companyId, deletedAt: null } });
}
