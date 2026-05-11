import { prisma, Prisma } from "@/packages/db";
import { AuditAction, ProjectStatus } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { publish } from "@/packages/events/bus";
import type { ProjectFormInput } from "../schemas";

export const listProjectsService = (companyId: string) =>
  prisma.project.findMany({
    where: { companyId, deletedAt: null },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

export async function getProjectService(companyId: string, id: string) {
  const p = await prisma.project.findFirst({
    where: { id, companyId, deletedAt: null },
    include: { customer: true, galleries: true },
  });
  if (!p) throw new AppError({ code: "NOT_FOUND", message: "Proyecto no encontrado" });
  return p;
}

export async function createProjectService(opts: {
  companyId: string;
  userId: string;
  data: ProjectFormInput;
}) {
  const p = await prisma.project.create({
    data: {
      companyId: opts.companyId,
      customerId: opts.data.customerId,
      name: opts.data.name,
      description: opts.data.description || null,
      status: opts.data.status,
      startDate: opts.data.startDate ?? null,
      endDate: opts.data.endDate ?? null,
      amount: opts.data.amount ? new Prisma.Decimal(opts.data.amount) : null,
    },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.CREATE,
    module: "crm",
    entityType: "Project",
    entityId: p.id,
    after: { name: p.name },
  });
  return p;
}

export async function updateProjectService(opts: {
  companyId: string;
  userId: string;
  id: string;
  data: ProjectFormInput;
}) {
  await getProjectService(opts.companyId, opts.id);
  const u = await prisma.project.update({
    where: { id: opts.id },
    data: {
      customerId: opts.data.customerId,
      name: opts.data.name,
      description: opts.data.description || null,
      status: opts.data.status,
      startDate: opts.data.startDate ?? null,
      endDate: opts.data.endDate ?? null,
      amount: opts.data.amount ? new Prisma.Decimal(opts.data.amount) : null,
    },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.UPDATE,
    module: "crm",
    entityType: "Project",
    entityId: opts.id,
    after: { status: u.status },
  });
  if (opts.data.status === ProjectStatus.COMPLETED) {
    await publish("project.completed", { projectId: opts.id, companyId: opts.companyId });
  }
  return u;
}
