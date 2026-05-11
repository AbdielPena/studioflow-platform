"use server";

import { revalidatePath } from "next/cache";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { ok, toActionResult, type ActionResult } from "@/packages/lib/errors";
import {
  createInvoiceSchema,
  voidInvoiceSchema,
  addPaymentSchema,
  type CreateInvoiceInput,
  type AddPaymentInput,
} from "../schemas/invoice.schema";
import {
  createDraftInvoiceService,
  confirmInvoiceService,
  voidInvoiceService,
  addPaymentService,
} from "../services/invoice.service";

export async function createInvoiceAction(
  input: CreateInvoiceInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FACTURACION_INVOICE_CREATE);
    const parsed = createInvoiceSchema.parse(input);
    const inv = await createDraftInvoiceService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      input: parsed,
    });
    revalidatePath("/facturacion");
    return ok({ id: inv.id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function confirmInvoiceAction(
  invoiceId: string,
): Promise<ActionResult<{ id: string; ncf: string | null }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FACTURACION_INVOICE_UPDATE);
    const inv = await confirmInvoiceService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      invoiceId,
    });
    revalidatePath("/facturacion");
    revalidatePath(`/facturacion/invoices/${invoiceId}`);
    return ok({ id: inv.id, ncf: inv.ncf });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function voidInvoiceAction(
  input: { invoiceId: string; reason: string },
): Promise<ActionResult<{ ok: true }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FACTURACION_INVOICE_VOID);
    const parsed = voidInvoiceSchema.parse(input);
    await voidInvoiceService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      invoiceId: parsed.invoiceId,
      reason: parsed.reason,
    });
    revalidatePath(`/facturacion/invoices/${parsed.invoiceId}`);
    return ok({ ok: true });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function addPaymentAction(
  input: AddPaymentInput,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FACTURACION_INVOICE_UPDATE);
    const parsed = addPaymentSchema.parse(input);
    await addPaymentService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      input: parsed,
    });
    revalidatePath(`/facturacion/invoices/${parsed.invoiceId}`);
    return ok({ ok: true });
  } catch (err) {
    return toActionResult(err);
  }
}
