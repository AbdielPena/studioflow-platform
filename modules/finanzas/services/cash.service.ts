import { prisma, Prisma } from "@/packages/db";
import { AuditAction, CashSessionStatus } from "@prisma/client";
import { D } from "@/lib/decimal";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import type {
  OpenCashSessionInput,
  CloseCashSessionInput,
  CreateCashRegisterInput,
  CreateBankAccountInput,
} from "../schemas/cash.schema";

// ============================================================================
// Cash registers
// ============================================================================

export const listCashRegistersService = (companyId: string) =>
  prisma.cashRegister.findMany({
    where: { companyId, deletedAt: null },
    include: { branch: true, sessions: { where: { status: "OPEN" }, take: 1 } },
    orderBy: { name: "asc" },
  });

export async function createCashRegisterService(opts: {
  companyId: string;
  userId: string;
  data: CreateCashRegisterInput;
}) {
  const cr = await prisma.cashRegister.create({
    data: {
      companyId: opts.companyId,
      branchId: opts.data.branchId ?? null,
      name: opts.data.name,
    },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.CREATE,
    module: "finanzas",
    entityType: "CashRegister",
    entityId: cr.id,
    after: { name: cr.name },
  });
  return cr;
}

// ============================================================================
// Cash sessions
// ============================================================================

export async function getActiveCashSession(opts: {
  cashRegisterId: string;
  userId: string;
}) {
  return prisma.cashSession.findFirst({
    where: {
      cashRegisterId: opts.cashRegisterId,
      userId: opts.userId,
      status: CashSessionStatus.OPEN,
    },
  });
}

export async function openCashSessionService(opts: {
  companyId: string;
  userId: string;
  data: OpenCashSessionInput;
}) {
  const existing = await getActiveCashSession({
    cashRegisterId: opts.data.cashRegisterId,
    userId: opts.userId,
  });
  if (existing) {
    throw new AppError({
      code: "CONFLICT",
      message: "Ya tienes una sesión abierta en esta caja",
    });
  }
  const session = await prisma.cashSession.create({
    data: {
      cashRegisterId: opts.data.cashRegisterId,
      userId: opts.userId,
      openingAmount: new Prisma.Decimal(opts.data.openingAmount),
      status: CashSessionStatus.OPEN,
      notes: opts.data.notes || null,
    },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.CREATE,
    module: "finanzas",
    entityType: "CashSession",
    entityId: session.id,
    after: { opening: opts.data.openingAmount },
  });
  return session;
}

export async function closeCashSessionService(opts: {
  companyId: string;
  userId: string;
  data: CloseCashSessionInput;
}) {
  const session = await prisma.cashSession.findUnique({
    where: { id: opts.data.sessionId },
  });
  if (!session) {
    throw new AppError({ code: "NOT_FOUND", message: "Sesión no encontrada" });
  }
  if (session.status !== CashSessionStatus.OPEN) {
    throw new AppError({
      code: "PRECONDITION_FAILED",
      message: "La sesión no está abierta",
    });
  }

  const incomes = await prisma.financialTransaction.aggregate({
    where: { cashSessionId: session.id, type: "INCOME" },
    _sum: { amount: true },
  });
  const expenses = await prisma.financialTransaction.aggregate({
    where: { cashSessionId: session.id, type: "EXPENSE" },
    _sum: { amount: true },
  });
  const expected = D(session.openingAmount)
    .plus(D(incomes._sum.amount?.toString() ?? "0"))
    .minus(D(expenses._sum.amount?.toString() ?? "0"));
  const closing = D(opts.data.closingAmount);
  const difference = closing.minus(expected);

  const updated = await prisma.cashSession.update({
    where: { id: opts.data.sessionId },
    data: {
      closingAmount: new Prisma.Decimal(closing.toFixed(2)),
      expectedAmount: new Prisma.Decimal(expected.toFixed(2)),
      difference: new Prisma.Decimal(difference.toFixed(2)),
      status: CashSessionStatus.CLOSED,
      closedAt: new Date(),
      notes: opts.data.notes ?? session.notes,
    },
  });

  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.UPDATE,
    module: "finanzas",
    entityType: "CashSession",
    entityId: opts.data.sessionId,
    after: {
      closing: closing.toFixed(2),
      expected: expected.toFixed(2),
      difference: difference.toFixed(2),
    },
  });
  return updated;
}

// ============================================================================
// Bank accounts
// ============================================================================

export const listBankAccountsService = (companyId: string) =>
  prisma.bankAccount.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { name: "asc" },
  });

export async function createBankAccountService(opts: {
  companyId: string;
  userId: string;
  data: CreateBankAccountInput;
}) {
  const ba = await prisma.bankAccount.create({
    data: {
      companyId: opts.companyId,
      name: opts.data.name,
      bankName: opts.data.bankName || null,
      accountNumber: opts.data.accountNumber || null,
      accountType: opts.data.accountType ?? null,
      currency: opts.data.currency,
      isActive: opts.data.isActive,
    },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.CREATE,
    module: "finanzas",
    entityType: "BankAccount",
    entityId: ba.id,
    after: { name: ba.name, currency: ba.currency },
  });
  return ba;
}
