import { prisma } from "@/packages/db";
import {
  Prisma,
  QuoteStatus,
  AuditAction,
} from "@prisma/client";
import { D, calculateLineTotal, sumMoney } from "@/lib/decimal";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { publish } from "@/packages/events/bus";
import { createDraftInvoiceService } from "./invoice.service";
import type { CreateQuoteInput } from "../schemas/quote.schema";

export const listQuotesService = (companyId: string) =>
  prisma.quote.findMany({
    where: { companyId, deletedAt: null },
    include: { customer: true },
    orderBy: { issueDate: "desc" },
    take: 200,
  });

export async function getQuoteService(companyId: string, id: string) {
  const q = await prisma.quote.findFirst({
    where: { id, companyId, deletedAt: null },
    include: {
      customer: true,
      items: { orderBy: { position: "asc" } },
      convertedInvoice: { select: { id: true, number: true, status: true } },
    },
  });
  if (!q) throw new AppError({ code: "NOT_FOUND", message: "Cotización no encontrada" });
  return q;
}

export async function createQuoteService(opts: {
  companyId: string;
  userId: string;
  input: CreateQuoteInput;
}) {
  const { companyId, userId, input } = opts;

  const computed = input.items.map((it, idx) => {
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
  const total = subtotal.minus(discountTotal).plus(taxTotal);

  const quote = await prisma.$transaction(async (tx) => {
    const last = await tx.quote.count({ where: { companyId } });
    const number = `COT-${String(last + 1).padStart(6, "0")}`;

    return tx.quote.create({
      data: {
        companyId,
        branchId: input.branchId ?? null,
        customerId: input.customerId,
        createdById: userId,
        number,
        status: QuoteStatus.DRAFT,
        expiresAt: input.expiresAt ?? null,
        currency: input.currency,
        exchangeRate: new Prisma.Decimal(input.exchangeRate),
        subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
        discountTotal: new Prisma.Decimal(discountTotal.toFixed(2)),
        taxTotal: new Prisma.Decimal(taxTotal.toFixed(2)),
        total: new Prisma.Decimal(total.toFixed(2)),
        notes: input.notes,
        terms: input.terms,
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
    entityType: "Quote",
    entityId: quote.id,
    after: { number: quote.number, total: total.toFixed(2) },
  });
  return quote;
}

export async function updateQuoteStatusService(opts: {
  companyId: string;
  userId: string;
  id: string;
  status: QuoteStatus;
}) {
  const q = await getQuoteService(opts.companyId, opts.id);
  if (q.status === QuoteStatus.CONVERTED) {
    throw new AppError({ code: "CONFLICT", message: "Esta cotización ya fue convertida en factura" });
  }
  const updated = await prisma.quote.update({
    where: { id: opts.id },
    data: { status: opts.status },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.UPDATE,
    module: "facturacion",
    entityType: "Quote",
    entityId: opts.id,
    before: { status: q.status },
    after: { status: opts.status },
  });
  return updated;
}

export async function convertQuoteToInvoiceService(opts: {
  companyId: string;
  userId: string;
  id: string;
}) {
  const quote = await getQuoteService(opts.companyId, opts.id);
  if (quote.status === QuoteStatus.CONVERTED) {
    throw new AppError({ code: "CONFLICT", message: "Esta cotización ya fue convertida" });
  }
  if (quote.status === QuoteStatus.CANCELLED || quote.status === QuoteStatus.REJECTED) {
    throw new AppError({
      code: "PRECONDITION_FAILED",
      message: "No puedes convertir una cotización cancelada o rechazada",
    });
  }

  const invoice = await createDraftInvoiceService({
    companyId: opts.companyId,
    userId: opts.userId,
    input: {
      customerId: quote.customerId,
      branchId: quote.branchId,
      paymentMethod: "CASH",
      isCredit: false,
      currency: quote.currency,
      exchangeRate: Number(quote.exchangeRate),
      tipAmount: 0,
      items: quote.items.map((it, idx) => ({
        productId: it.productId,
        description: it.description,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        discount: Number(it.discount),
        taxRate: Number(it.taxRate),
        position: idx,
      })),
      notes: quote.notes,
    },
  });

  await prisma.quote.update({
    where: { id: opts.id },
    data: { status: QuoteStatus.CONVERTED, convertedInvoiceId: invoice.id },
  });

  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.UPDATE,
    module: "facturacion",
    entityType: "Quote",
    entityId: opts.id,
    after: { convertedToInvoice: invoice.id },
  });

  await publish("quote.converted", {
    quoteId: opts.id,
    invoiceId: invoice.id,
    companyId: opts.companyId,
  });

  return invoice;
}
