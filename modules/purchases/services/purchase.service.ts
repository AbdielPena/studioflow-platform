import { prisma, Prisma } from "@/packages/db";
import {
  PurchaseStatus,
  AccountStatus,
  AuditAction,
} from "@prisma/client";
import { D, calculateLineTotal, sumMoney } from "@/lib/decimal";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import type { CreatePurchaseInput } from "../schemas/purchase.schema";

export const listPurchasesService = (companyId: string) =>
  prisma.purchase.findMany({
    where: { companyId, deletedAt: null },
    include: { supplier: true },
    orderBy: { issueDate: "desc" },
    take: 200,
  });

export async function getPurchaseService(companyId: string, id: string) {
  const p = await prisma.purchase.findFirst({
    where: { id, companyId, deletedAt: null },
    include: {
      supplier: true,
      branch: true,
      items: { orderBy: { position: "asc" } },
      payable: true,
    },
  });
  if (!p) throw new AppError({ code: "NOT_FOUND", message: "Compra no encontrada" });
  return p;
}

export async function createPurchaseService(opts: {
  companyId: string;
  userId: string;
  input: CreatePurchaseInput;
}) {
  const { companyId, userId, input } = opts;

  const supplier = await prisma.supplier.findFirst({
    where: { id: input.supplierId, companyId, deletedAt: null },
  });
  if (!supplier) throw new AppError({ code: "NOT_FOUND", message: "Suplidor no encontrado" });

  const computed = input.items.map((it, idx) => {
    const r = calculateLineTotal({
      quantity: it.quantity,
      unitPrice: it.unitCost,
      taxRate: it.taxRate,
    });
    return {
      ...it,
      position: it.position ?? idx,
      subtotal: r.subtotal,
      taxAmount: r.taxAmount,
      lineTotal: r.total,
    };
  });

  const subtotal = sumMoney(computed.map((i) => i.subtotal));
  const taxTotal = sumMoney(computed.map((i) => i.taxAmount));
  const total = subtotal.plus(taxTotal);

  const purchase = await prisma.$transaction(async (tx) => {
    const last = await tx.purchase.count({ where: { companyId } });
    const number = `OC-${String(last + 1).padStart(6, "0")}`;
    const created = await tx.purchase.create({
      data: {
        companyId,
        branchId: input.branchId ?? null,
        supplierId: input.supplierId,
        number,
        ncfSupplier: input.ncfSupplier || null,
        status: PurchaseStatus.RECEIVED,
        isCredit: input.isCredit,
        dueDate: input.dueDate ?? null,
        currency: input.currency,
        exchangeRate: new Prisma.Decimal(input.exchangeRate),
        subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
        taxTotal: new Prisma.Decimal(taxTotal.toFixed(2)),
        total: new Prisma.Decimal(total.toFixed(2)),
        balanceDue: new Prisma.Decimal(total.toFixed(2)),
        notes: input.notes,
        items: {
          createMany: {
            data: computed.map((i) => ({
              productId: i.productId ?? null,
              description: i.description,
              quantity: new Prisma.Decimal(i.quantity),
              unitCost: new Prisma.Decimal(i.unitCost),
              taxRate: new Prisma.Decimal(i.taxRate),
              taxAmount: new Prisma.Decimal(i.taxAmount.toFixed(2)),
              lineTotal: new Prisma.Decimal(i.lineTotal.toFixed(2)),
              position: i.position,
            })),
          },
        },
      },
    });

    if (input.isCredit) {
      await tx.accountPayable.create({
        data: {
          companyId,
          supplierId: input.supplierId,
          purchaseId: created.id,
          total: new Prisma.Decimal(total.toFixed(2)),
          balanceDue: new Prisma.Decimal(total.toFixed(2)),
          dueDate: input.dueDate ?? null,
          status: AccountStatus.OPEN,
        },
      });
    }

    return created;
  });

  await audit({
    companyId,
    userId,
    action: AuditAction.CREATE,
    module: "purchases",
    entityType: "Purchase",
    entityId: purchase.id,
    after: { number: purchase.number, total: total.toFixed(2) },
  });
  return purchase;
}

export async function addPayablePaymentService(opts: {
  companyId: string;
  userId: string;
  payableId: string;
  amount: number;
  method: "CASH" | "CARD" | "TRANSFER" | "CHECK" | "DIGITAL_WALLET" | "OTHER";
  reference?: string | null;
  bankAccountId?: string | null;
}) {
  const payable = await prisma.accountPayable.findFirst({
    where: { id: opts.payableId, companyId: opts.companyId },
    include: { purchase: true },
  });
  if (!payable) throw new AppError({ code: "NOT_FOUND", message: "CxP no encontrada" });
  const amount = D(opts.amount);
  const newPaid = D(payable.paidAmount).plus(amount);
  const total = D(payable.total);
  if (newPaid.gt(total)) {
    throw new AppError({ code: "VALIDATION_ERROR", message: "El pago excede el balance" });
  }

  await prisma.$transaction(async (tx) => {
    await tx.payablePayment.create({
      data: {
        payableId: opts.payableId,
        amount: new Prisma.Decimal(opts.amount),
        method: opts.method,
        reference: opts.reference || null,
        bankAccountId: opts.bankAccountId || null,
        paidById: opts.userId,
      },
    });
    const newBalance = total.minus(newPaid);
    const fullyPaid = newBalance.isZero();
    await tx.accountPayable.update({
      where: { id: opts.payableId },
      data: {
        paidAmount: new Prisma.Decimal(newPaid.toFixed(2)),
        balanceDue: new Prisma.Decimal(newBalance.toFixed(2)),
        status: fullyPaid ? AccountStatus.PAID : AccountStatus.PARTIALLY_PAID,
      },
    });
    await tx.purchase.update({
      where: { id: payable.purchaseId },
      data: {
        paidAmount: new Prisma.Decimal(newPaid.toFixed(2)),
        balanceDue: new Prisma.Decimal(newBalance.toFixed(2)),
        status: fullyPaid ? PurchaseStatus.PAID : PurchaseStatus.PARTIALLY_PAID,
      },
    });
  });

  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.UPDATE,
    module: "finanzas",
    entityType: "PayablePayment",
    entityId: opts.payableId,
    after: { amount: amount.toFixed(2), method: opts.method },
  });
}
