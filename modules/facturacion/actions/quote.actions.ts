"use server";

import { revalidatePath } from "next/cache";
import { QuoteStatus } from "@prisma/client";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { ok, toActionResult, type ActionResult } from "@/packages/lib/errors";
import { createQuoteSchema, type CreateQuoteInput } from "../schemas/quote.schema";
import {
  createQuoteService,
  updateQuoteStatusService,
  convertQuoteToInvoiceService,
} from "../services/quote.service";

export async function createQuoteAction(
  input: CreateQuoteInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FACTURACION_QUOTE_CREATE);
    const parsed = createQuoteSchema.parse(input);
    const q = await createQuoteService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      input: parsed,
    });
    revalidatePath("/facturacion/quotes");
    return ok({ id: q.id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function setQuoteStatusAction(
  id: string,
  status: QuoteStatus,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FACTURACION_QUOTE_UPDATE);
    await updateQuoteStatusService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      id,
      status,
    });
    revalidatePath(`/facturacion/quotes/${id}`);
    revalidatePath("/facturacion/quotes");
    return ok({ id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function convertQuoteAction(
  id: string,
): Promise<ActionResult<{ invoiceId: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FACTURACION_QUOTE_CONVERT);
    const invoice = await convertQuoteToInvoiceService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      id,
    });
    revalidatePath(`/facturacion/quotes/${id}`);
    revalidatePath("/facturacion");
    return ok({ invoiceId: invoice.id });
  } catch (err) {
    return toActionResult(err);
  }
}
