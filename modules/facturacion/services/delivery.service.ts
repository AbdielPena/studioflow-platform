import { prisma, Prisma } from "@/packages/db";
import {
  AuditAction,
  DeliveryStatus,
  InvoiceStatus,
} from "@prisma/client";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import type { CreateDeliveryInput } from "../schemas/delivery.schema";

export const listDeliveriesService = (companyId: string) =>
  prisma.delivery.findMany({
    where: { companyId, deletedAt: null },
    include: { invoice: { include: { customer: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

export async function getDeliveryService(companyId: string, id: string) {
  const d = await prisma.delivery.findFirst({
    where: { id, companyId, deletedAt: null },
    include: {
      invoice: { include: { customer: true } },
      branch: true,
      items: true,
    },
  });
  if (!d) throw new AppError({ code: "NOT_FOUND", message: "Conduce no encontrado" });
  return d;
}

export async function createDeliveryService(opts: {
  companyId: string;
  userId: string;
  input: CreateDeliveryInput;
}) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: opts.input.invoiceId, companyId: opts.companyId, deletedAt: null },
    include: { items: true },
  });
  if (!invoice) {
    throw new AppError({ code: "NOT_FOUND", message: "Factura no encontrada" });
  }
  if (invoice.status === InvoiceStatus.DRAFT) {
    throw new AppError({
      code: "PRECONDITION_FAILED",
      message: "La factura debe estar confirmada para generar conduce",
    });
  }
  if (invoice.status === InvoiceStatus.VOIDED) {
    throw new AppError({
      code: "PRECONDITION_FAILED",
      message: "No se puede generar conduce de una factura anulada",
    });
  }

  const delivery = await prisma.$transaction(async (tx) => {
    const last = await tx.delivery.count({ where: { companyId: opts.companyId } });
    const number = `CON-${String(last + 1).padStart(6, "0")}`;

    return tx.delivery.create({
      data: {
        companyId: opts.companyId,
        branchId: invoice.branchId,
        invoiceId: invoice.id,
        number,
        status: DeliveryStatus.PENDING,
        driverName: opts.input.driverName || null,
        vehiclePlate: opts.input.vehiclePlate || null,
        route: opts.input.route || null,
        notes: opts.input.notes || null,
        inventorySyncStatusSnapshot: invoice.inventorySyncStatus,
        items: {
          createMany: {
            data: opts.input.items.map((it, idx) => {
              const invoiceItem = invoice.items.find((i) => i.id === it.invoiceItemId);
              return {
                productId: invoiceItem?.productId ?? null,
                description: it.description,
                quantity: new Prisma.Decimal(it.quantity),
                position: idx,
              };
            }),
          },
        },
      },
    });
  });

  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.CREATE,
    module: "facturacion",
    entityType: "Delivery",
    entityId: delivery.id,
    after: { number: delivery.number, invoiceId: invoice.id },
  });
  return delivery;
}

export async function updateDeliveryStatusService(opts: {
  companyId: string;
  userId: string;
  id: string;
  status: DeliveryStatus;
}) {
  const d = await getDeliveryService(opts.companyId, opts.id);
  const updated = await prisma.delivery.update({
    where: { id: opts.id },
    data: {
      status: opts.status,
      dispatchedAt:
        opts.status === DeliveryStatus.IN_TRANSIT && !d.dispatchedAt ? new Date() : undefined,
      deliveredAt:
        opts.status === DeliveryStatus.DELIVERED && !d.deliveredAt ? new Date() : undefined,
      signedAt:
        opts.status === DeliveryStatus.SIGNED && !d.signedAt ? new Date() : undefined,
    },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.UPDATE,
    module: "facturacion",
    entityType: "Delivery",
    entityId: opts.id,
    before: { status: d.status },
    after: { status: opts.status },
  });
  return updated;
}
