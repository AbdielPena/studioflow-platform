import { prisma } from "@/packages/db";
import {
  Prisma,
  InvoiceStatus,
  InventorySyncStatus,
  AccountStatus,
  AuditAction,
} from "@prisma/client";
import { D, calculateLineTotal, sumMoney } from "@/lib/decimal";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { publish } from "@/packages/events/bus";
import type { CreateInvoiceInput } from "../schemas/invoice.schema";

// ============================================================================
// Invoice Service — Fase 2 implementará el flujo completo.
// Este es el skeleton con la lógica crítica de cálculo + transacción.
// ============================================================================

export async function createInvoice(opts: {
  companyId: string;
  userId: string;
  input: CreateInvoiceInput;
}) {
  const { companyId, userId, input } = opts;

  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, companyId, deletedAt: null },
  });
  if (!customer) {
    throw new AppError({ code: "NOT_FOUND", message: "Cliente no encontrado" });
  }

  const computedItems = input.items.map((it, idx) => {
    const r = calculateLineTotal({
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      discount: it.discount,
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

  const subtotal = sumMoney(computedItems.map((i) => i.subtotal));
  const discountTotal = sumMoney(computedItems.map((i) => D(i.discount)));
  const taxTotal = sumMoney(computedItems.map((i) => i.taxAmount));
  const tipAmount = D(input.tipAmount);
  const total = subtotal.minus(discountTotal).plus(taxTotal).plus(tipAmount);

  const invoice = await prisma.$transaction(async (tx) => {
    const lastNumber = await tx.invoice.count({ where: { companyId } });
    const number = `INV-${String(lastNumber + 1).padStart(6, "0")}`;

    const created = await tx.invoice.create({
      data: {
        companyId,
        branchId: input.branchId ?? null,
        customerId: input.customerId,
        createdById: userId,
        number,
        status: InvoiceStatus.DRAFT,
        paymentMethod: input.paymentMethod,
        isCredit: input.isCredit,
        dueDate: input.dueDate ?? null,
        currency: input.currency,
        exchangeRate: new Prisma.Decimal(input.exchangeRate),
        subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
        discountTotal: new Prisma.Decimal(discountTotal.toFixed(2)),
        taxTotal: new Prisma.Decimal(taxTotal.toFixed(2)),
        tipAmount: new Prisma.Decimal(tipAmount.toFixed(2)),
        total: new Prisma.Decimal(total.toFixed(2)),
        balanceDue: new Prisma.Decimal(total.toFixed(2)),
        inventorySyncStatus: InventorySyncStatus.NOT_REQUIRED,
        notes: input.notes,
        items: {
          createMany: {
            data: computedItems.map((i) => ({
              productId: i.productId ?? null,
              description: i.description,
              quantity: new Prisma.Decimal(i.quantity),
              unitPrice: new Prisma.Decimal(i.unitPrice),
              discount: new Prisma.Decimal(i.discount),
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
      await tx.accountReceivable.create({
        data: {
          companyId,
          customerId: input.customerId,
          invoiceId: created.id,
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
    module: "facturacion",
    entityType: "Invoice",
    entityId: invoice.id,
    after: { number: invoice.number, total: total.toFixed(2) },
  });

  await publish("invoice.created", { invoiceId: invoice.id, companyId });
  return invoice;
}
