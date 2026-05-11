import { prisma } from "@/packages/db";

export async function listReceivablesService(opts: {
  companyId: string;
  status?: "OPEN" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "WRITTEN_OFF";
}) {
  return prisma.accountReceivable.findMany({
    where: {
      companyId: opts.companyId,
      deletedAt: null,
      status: opts.status,
    },
    include: { customer: true, invoice: true },
    orderBy: { dueDate: "asc" },
  });
}

export async function listPayablesService(opts: {
  companyId: string;
  status?: "OPEN" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "WRITTEN_OFF";
}) {
  return prisma.accountPayable.findMany({
    where: {
      companyId: opts.companyId,
      deletedAt: null,
      status: opts.status,
    },
    include: { supplier: true, purchase: true },
    orderBy: { dueDate: "asc" },
  });
}

export async function getFinanceSummary(companyId: string) {
  const [receivableAgg, payableAgg, overdueReceivables, overduePayables] = await Promise.all([
    prisma.accountReceivable.aggregate({
      where: { companyId, deletedAt: null, status: { in: ["OPEN", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { balanceDue: true },
      _count: true,
    }),
    prisma.accountPayable.aggregate({
      where: { companyId, deletedAt: null, status: { in: ["OPEN", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { balanceDue: true },
      _count: true,
    }),
    prisma.accountReceivable.count({
      where: {
        companyId,
        deletedAt: null,
        status: { in: ["OPEN", "PARTIALLY_PAID"] },
        dueDate: { lt: new Date() },
      },
    }),
    prisma.accountPayable.count({
      where: {
        companyId,
        deletedAt: null,
        status: { in: ["OPEN", "PARTIALLY_PAID"] },
        dueDate: { lt: new Date() },
      },
    }),
  ]);

  return {
    receivable: {
      total: receivableAgg._sum.balanceDue?.toString() ?? "0",
      count: receivableAgg._count,
      overdue: overdueReceivables,
    },
    payable: {
      total: payableAgg._sum.balanceDue?.toString() ?? "0",
      count: payableAgg._count,
      overdue: overduePayables,
    },
  };
}
