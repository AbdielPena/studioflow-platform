import { AuditAction } from "@prisma/client";
import { prisma } from "@/packages/db";
import { audit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import type { CompanyFormInput } from "../schemas";

export async function getCompanyService(companyId: string) {
  const c = await prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
  });
  if (!c) throw new AppError({ code: "NOT_FOUND", message: "Empresa no encontrada" });
  return c;
}

export async function updateCompanyService(opts: {
  companyId: string;
  userId: string;
  data: CompanyFormInput;
}) {
  const before = await getCompanyService(opts.companyId);
  const after = await prisma.company.update({
    where: { id: opts.companyId },
    data: {
      legalName: opts.data.legalName,
      tradeName: opts.data.tradeName || null,
      rnc: opts.data.rnc || null,
      logoUrl: opts.data.logoUrl || null,
      email: opts.data.email || null,
      phone: opts.data.phone || null,
      address: opts.data.address || null,
      city: opts.data.city || null,
      country: opts.data.country,
      currency: opts.data.currency,
      timezone: opts.data.timezone,
    },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.UPDATE,
    module: "settings",
    entityType: "Company",
    entityId: opts.companyId,
    before: { legalName: before.legalName },
    after: { legalName: after.legalName },
  });
  return after;
}
