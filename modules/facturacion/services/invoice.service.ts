import { prisma } from "@/packages/db";
import {
  Prisma,
  InvoiceStatus,
  InventorySyncStatus,
  InventoryJobType,
  AccountStatus,
  AuditAction,
  type NcfType,
} from "@prisma/client";
import { D, calculateLineTotal, sumMoney } from "@/lib/decimal";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { publish } from "@/packages/events/bus";
import { assignNextNcf } from "../repositories/ncf.repository";
import type {
  CreateInvoiceInput,
  AddPaymentInput,
} from "../schemas/invoice.schema";

// ============================================================================
// Invoice service — flujo: createDraft → confirm → addPayment / void
// ============================================================================

export async function listInvoicesService(opts: {
  companyId: string;
  status?: InvoiceStatus;
  customerId?: string;
}) {
  return prisma.invoice.findMany({
    where: {
      companyId: opts.companyId,
      deletedAt: null,
      status: opts.status,
      customerId: opts.customerId,
    },
    include: { customer: true, ncfSequence: true },
    orderBy: { issueDate: "desc" },
    take: 200,
  });
}

export async function getInvoiceService(companyId: string, id: string) {
  const inv = await prisma.invoice.findFirst({
    where: { id, companyId, deletedAt: null },
    include: {
      customer: true,
      branch: true,
      createdBy: { select: { id: true, name: true, email: true } },
      voidedBy: { select: { id: true, name: true, email: true } },
      ncfSequence: true,
      items: { orderBy: { position: "asc" } },
      payments: { orderBy: { receivedAt: "desc" } },
      receivable: true,
    },
  });
  if (!inv) throw new AppError({ code: "NOT_FOUND", message: "Factura no encontrada" });
  return inv;
}

function computeTotals(items: CreateInvoiceInput["items"], tipAmount: number) {
  const computed = items.map((it, idx) => {
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

  const subtotal = sumMoney(computed.map((i) => i.subtotal));
  const discountTotal = sumMoney(computed.map((i) => D(i.discount)));
  const taxTotal = sumMoney(computed.map((i) => i.taxAmount));
  const tip = D(tipAmount);
  const total = subtotal.minus(discountTotal).plus(taxTotal).plus(tip);

  return { computed, subtotal, discountTotal, taxTotal, tip, total };
}

export async function createDraftInvoiceService(opts: {
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

  const { computed, subtotal, discountTotal, taxTotal, tip, total } = computeTotals(
    input.items,
    input.tipAmount,
  );

  const invoice = await prisma.$transaction(async (tx) => {
    const lastNumber = await tx.invoice.count({ where: { companyId } });
    const number = `INV-${String(lastNumber + 1).padStart(6, "0")}`;

    return tx.invoice.create({
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
        tipAmount: new Prisma.Decimal(tip.toFixed(2)),
        total: new Prisma.Decimal(total.toFixed(2)),
        balanceDue: new Prisma.Decimal(total.toFixed(2)),
        ncfType: (input.ncfType as NcfType | null) ?? null,
        inventorySyncStatus: InventorySyncStatus.NOT_REQUIRED,
        notes: input.notes,
        items: {
          createMany: {
            data: computed.map((i) => ({
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

export async function confirmInvoiceService(opts: {
  companyId: string;
  userId: string;
  invoiceId: string;
}) {
  const inv = await getInvoiceService(opts.companyId, opts.invoiceId);
  if (inv.status !== InvoiceStatus.DRAFT) {
    throw new AppError({
      code: "PRECONDITION_FAILED",
      message: "Solo se pueden confirmar facturas en borrador",
    });
  }

  const updated = await prisma.$transaction(async (tx) => {
    let ncfData: { sequenceId: string; ncf: string } | null = null;
    if (inv.ncfType) {
      const assigned = await assignNextNcf({
        tx,
        companyId: opts.companyId,
        type: inv.ncfType,
        branchId: inv.branchId,
      });
      ncfData = { sequenceId: assigned.sequenceId, ncf: assigned.ncf };
    }

    const updated = await tx.invoice.update({
      where: { id: opts.invoiceId },
      data: {
        status: InvoiceStatus.ISSUED,
        ncf: ncfData?.ncf ?? null,
        ncfSequenceId: ncfData?.sequenceId ?? null,
        issueDate: new Date(),
      },
    });

    if (inv.isCredit) {
      await tx.accountReceivable.create({
        data: {
          companyId: opts.companyId,
          customerId: inv.customerId,
          invoiceId: opts.invoiceId,
          total: updated.total,
          balanceDue: updated.total,
          dueDate: updated.dueDate ?? null,
          status: AccountStatus.OPEN,
        },
      });
    }

    // Encolar job de descuento de inventario externo si hay productos
    const hasPhysicalItems = inv.items.some(
      (it) => it.productId && it.externalProductId,
    );
    if (hasPhysicalItems) {
      const activeConn = await tx.externalInventoryConnection.findFirst({
        where: {
          companyId: opts.companyId,
          isActive: true,
          deletedAt: null,
          manualMode: false,
        },
      });
      if (activeConn) {
        await tx.pendingInventorySyncJob.create({
          data: {
            companyId: opts.companyId,
            connectionId: activeConn.id,
            invoiceId: opts.invoiceId,
            jobType: InventoryJobType.COMMIT,
            payload: {
              invoiceId: opts.invoiceId,
              items: inv.items
                .filter((i) => i.externalProductId)
                .map((i) => ({
                  externalProductId: i.externalProductId,
                  quantity: i.quantity.toString(),
                })),
            } as Prisma.InputJsonValue,
          },
        });
        await tx.invoice.update({
          where: { id: opts.invoiceId },
          data: { inventorySyncStatus: InventorySyncStatus.PENDING },
        });
      }
    }

    return updated;
  });

  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.CONFIRM,
    module: "facturacion",
    entityType: "Invoice",
    entityId: opts.invoiceId,
    after: { status: "ISSUED", ncf: updated.ncf },
  });

  await publish("invoice.confirmed", { invoiceId: opts.invoiceId, companyId: opts.companyId });
  return updated;
}

export async function voidInvoiceService(opts: {
  companyId: string;
  userId: string;
  invoiceId: string;
  reason: string;
}) {
  const inv = await getInvoiceService(opts.companyId, opts.invoiceId);
  if (inv.status === InvoiceStatus.DRAFT) {
    throw new AppError({
      code: "PRECONDITION_FAILED",
      message: "Una factura en borrador se elimina, no se anula",
    });
  }
  if (inv.status === InvoiceStatus.VOIDED) {
    throw new AppError({ code: "CONFLICT", message: "La factura ya está anulada" });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.invoice.update({
      where: { id: opts.invoiceId },
      data: {
        status: InvoiceStatus.VOIDED,
        voidedAt: new Date(),
        voidedById: opts.userId,
        voidReason: opts.reason,
      },
    });

    if (inv.receivable) {
      await tx.accountReceivable.update({
        where: { id: inv.receivable.id },
        data: { status: AccountStatus.WRITTEN_OFF, balanceDue: new Prisma.Decimal(0) },
      });
    }

    if (inv.inventorySyncStatus === InventorySyncStatus.SYNCED) {
      const activeConn = await tx.externalInventoryConnection.findFirst({
        where: { companyId: opts.companyId, isActive: true, deletedAt: null, manualMode: false },
      });
      if (activeConn) {
        await tx.pendingInventorySyncJob.create({
          data: {
            companyId: opts.companyId,
            connectionId: activeConn.id,
            invoiceId: opts.invoiceId,
            jobType: InventoryJobType.RELEASE,
            payload: { invoiceId: opts.invoiceId } as Prisma.InputJsonValue,
          },
        });
        await tx.invoice.update({
          where: { id: opts.invoiceId },
          data: { inventorySyncStatus: InventorySyncStatus.PENDING },
        });
      }
    }
    return u;
  });

  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.VOID,
    module: "facturacion",
    entityType: "Invoice",
    entityId: opts.invoiceId,
    after: { status: "VOIDED", reason: opts.reason },
  });

  await publish("invoice.voided", {
    invoiceId: opts.invoiceId,
    companyId: opts.companyId,
    reason: opts.reason,
  });
  return updated;
}

export async function addPaymentService(opts: {
  companyId: string;
  userId: string;
  input: AddPaymentInput;
}) {
  const inv = await getInvoiceService(opts.companyId, opts.input.invoiceId);
  const payableStatuses: InvoiceStatus[] = [
    InvoiceStatus.ISSUED,
    InvoiceStatus.PARTIALLY_PAID,
    InvoiceStatus.OVERDUE,
  ];
  if (!payableStatuses.includes(inv.status)) {
    throw new AppError({
      code: "PRECONDITION_FAILED",
      message: `No se pueden registrar pagos en facturas con estado ${inv.status}`,
    });
  }
  const amount = D(opts.input.amount);
  const newPaid = D(inv.paidAmount).plus(amount);
  const total = D(inv.total);
  if (newPaid.gt(total)) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "El pago excede el balance pendiente",
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.invoicePayment.create({
      data: {
        invoiceId: opts.input.invoiceId,
        method: opts.input.method,
        amount: new Prisma.Decimal(opts.input.amount),
        reference: opts.input.reference || null,
        bankAccountId: opts.input.bankAccountId || null,
        receivedAt: opts.input.receivedAt,
        notes: opts.input.notes || null,
      },
    });
    const newBalance = total.minus(newPaid);
    const fullyPaid = newBalance.isZero();
    await tx.invoice.update({
      where: { id: opts.input.invoiceId },
      data: {
        paidAmount: new Prisma.Decimal(newPaid.toFixed(2)),
        balanceDue: new Prisma.Decimal(newBalance.toFixed(2)),
        status: fullyPaid ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID,
      },
    });
    if (inv.receivable) {
      await tx.accountReceivable.update({
        where: { id: inv.receivable.id },
        data: {
          paidAmount: new Prisma.Decimal(newPaid.toFixed(2)),
          balanceDue: new Prisma.Decimal(newBalance.toFixed(2)),
          status: fullyPaid ? AccountStatus.PAID : AccountStatus.PARTIALLY_PAID,
        },
      });
    }
  });

  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.UPDATE,
    module: "facturacion",
    entityType: "InvoicePayment",
    entityId: opts.input.invoiceId,
    after: { amount: amount.toFixed(2), method: opts.input.method },
  });

  if (D(inv.total).minus(newPaid).isZero()) {
    await publish("invoice.paid", { invoiceId: opts.input.invoiceId, companyId: opts.companyId });
  }
}
