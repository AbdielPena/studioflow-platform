import { prisma, Prisma } from "@/packages/db";
import { AuditAction, LeadStage } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { publish } from "@/packages/events/bus";
import type { LeadFormInput } from "../schemas";

export const listLeadsService = (companyId: string) =>
  prisma.crmLead.findMany({
    where: { companyId, deletedAt: null },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

export async function getLeadService(companyId: string, id: string) {
  const l = await prisma.crmLead.findFirst({
    where: { id, companyId, deletedAt: null },
    include: { customer: true },
  });
  if (!l) throw new AppError({ code: "NOT_FOUND", message: "Lead no encontrado" });
  return l;
}

export async function createLeadService(opts: {
  companyId: string;
  userId: string;
  data: LeadFormInput;
}) {
  const l = await prisma.crmLead.create({
    data: {
      companyId: opts.companyId,
      name: opts.data.name,
      email: opts.data.email || null,
      phone: opts.data.phone || null,
      source: opts.data.source || null,
      stage: opts.data.stage,
      estimatedValue: opts.data.estimatedValue
        ? new Prisma.Decimal(opts.data.estimatedValue)
        : null,
      customerId: opts.data.customerId || null,
      notes: opts.data.notes || null,
      ownerId: opts.userId,
    },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.CREATE,
    module: "crm",
    entityType: "CrmLead",
    entityId: l.id,
    after: { name: l.name, stage: l.stage },
  });
  await publish("lead.created", { leadId: l.id, companyId: opts.companyId });
  return l;
}

export async function updateLeadService(opts: {
  companyId: string;
  userId: string;
  id: string;
  data: LeadFormInput;
}) {
  await getLeadService(opts.companyId, opts.id);
  const u = await prisma.crmLead.update({
    where: { id: opts.id },
    data: {
      name: opts.data.name,
      email: opts.data.email || null,
      phone: opts.data.phone || null,
      source: opts.data.source || null,
      stage: opts.data.stage,
      estimatedValue: opts.data.estimatedValue
        ? new Prisma.Decimal(opts.data.estimatedValue)
        : null,
      customerId: opts.data.customerId || null,
      notes: opts.data.notes || null,
    },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.UPDATE,
    module: "crm",
    entityType: "CrmLead",
    entityId: opts.id,
    after: { stage: u.stage },
  });
  return u;
}

export async function setLeadStageService(opts: {
  companyId: string;
  userId: string;
  id: string;
  stage: LeadStage;
}) {
  await getLeadService(opts.companyId, opts.id);
  const u = await prisma.crmLead.update({
    where: { id: opts.id },
    data: { stage: opts.stage },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.UPDATE,
    module: "crm",
    entityType: "CrmLead",
    entityId: opts.id,
    after: { stage: opts.stage },
  });
  return u;
}

export async function deleteLeadService(opts: {
  companyId: string;
  userId: string;
  id: string;
}) {
  await prisma.crmLead.update({
    where: { id: opts.id },
    data: { deletedAt: new Date() },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.DELETE,
    module: "crm",
    entityType: "CrmLead",
    entityId: opts.id,
  });
}
