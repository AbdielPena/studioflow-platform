import { AuditAction } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { isValidDocumentNumber } from "@/lib/fiscal";
import { publish } from "@/packages/events";
import * as repo from "../repositories/customer.repository";
import type { CustomerFormInput, CustomerListFilters } from "../schemas/customer.schema";

export const listCustomersService = (
  companyId: string,
  filters?: CustomerListFilters,
) => repo.listCustomers({ companyId, filters });

export async function getCustomerService(companyId: string, id: string) {
  const customer = await repo.findCustomer({ companyId, id });
  if (!customer) {
    throw new AppError({ code: "NOT_FOUND", message: "Cliente no encontrado" });
  }
  return customer;
}

export async function createCustomerService(opts: {
  companyId: string;
  userId: string;
  data: CustomerFormInput;
}) {
  if (
    opts.data.documentNumber &&
    !isValidDocumentNumber(opts.data.documentNumber)
  ) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "RNC/Cédula debe tener 9 u 11 dígitos",
    });
  }
  const customer = await repo.createCustomer({
    companyId: opts.companyId,
    data: opts.data,
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.CREATE,
    module: "customers",
    entityType: "Customer",
    entityId: customer.id,
    after: { legalName: customer.legalName, documentNumber: customer.documentNumber },
  });
  // Studio Business Hub — emit federado via bus interno (hub-dispatcher reenvía)
  void publish("customer.created", {
    customerId: customer.id,
    companyId: opts.companyId,
    legalName: customer.legalName ?? undefined,
    email: customer.email ?? null,
    phone: customer.phone ?? null,
    documentNumber: customer.documentNumber ?? null,
  });
  return customer;
}

export async function updateCustomerService(opts: {
  companyId: string;
  userId: string;
  id: string;
  data: CustomerFormInput;
}) {
  const before = await repo.findCustomer({ companyId: opts.companyId, id: opts.id });
  if (!before) {
    throw new AppError({ code: "NOT_FOUND", message: "Cliente no encontrado" });
  }
  if (
    opts.data.documentNumber &&
    !isValidDocumentNumber(opts.data.documentNumber)
  ) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "RNC/Cédula debe tener 9 u 11 dígitos",
    });
  }
  const after = await repo.updateCustomer({
    companyId: opts.companyId,
    id: opts.id,
    data: opts.data,
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.UPDATE,
    module: "customers",
    entityType: "Customer",
    entityId: opts.id,
    before: { legalName: before.legalName },
    after: { legalName: after.legalName },
  });
  void publish("customer.updated", {
    customerId: opts.id,
    companyId: opts.companyId,
    legalName: after.legalName ?? undefined,
    email: after.email ?? null,
    phone: after.phone ?? null,
  });
  return after;
}

export async function deleteCustomerService(opts: {
  companyId: string;
  userId: string;
  id: string;
}) {
  const before = await repo.findCustomer({ companyId: opts.companyId, id: opts.id });
  if (!before) {
    throw new AppError({ code: "NOT_FOUND", message: "Cliente no encontrado" });
  }
  await repo.softDeleteCustomer({ companyId: opts.companyId, id: opts.id });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.DELETE,
    module: "customers",
    entityType: "Customer",
    entityId: opts.id,
    before: { legalName: before.legalName },
  });
}
