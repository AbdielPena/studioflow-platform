"use server";

import { revalidatePath } from "next/cache";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { ok, toActionResult, type ActionResult } from "@/packages/lib/errors";
import {
  openCashSessionSchema,
  closeCashSessionSchema,
  createCashRegisterSchema,
  createBankAccountSchema,
  type OpenCashSessionInput,
  type CloseCashSessionInput,
  type CreateCashRegisterInput,
  type CreateBankAccountInput,
} from "../schemas/cash.schema";
import {
  openCashSessionService,
  closeCashSessionService,
  createCashRegisterService,
  createBankAccountService,
} from "../services/cash.service";

export async function openCashSessionAction(
  input: OpenCashSessionInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FINANZAS_CASH_OPEN);
    const parsed = openCashSessionSchema.parse(input);
    const s = await openCashSessionService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      data: parsed,
    });
    revalidatePath("/finanzas/cash");
    revalidatePath("/facturacion/pos");
    return ok({ id: s.id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function closeCashSessionAction(
  input: CloseCashSessionInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FINANZAS_CASH_CLOSE);
    const parsed = closeCashSessionSchema.parse(input);
    const s = await closeCashSessionService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      data: parsed,
    });
    revalidatePath("/finanzas/cash");
    revalidatePath("/facturacion/pos");
    return ok({ id: s.id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function createCashRegisterAction(
  input: CreateCashRegisterInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.PLATFORM_SETTINGS_MANAGE);
    const parsed = createCashRegisterSchema.parse(input);
    const cr = await createCashRegisterService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      data: parsed,
    });
    revalidatePath("/finanzas/cash");
    return ok({ id: cr.id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function createBankAccountAction(
  input: CreateBankAccountInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FINANZAS_BANK_MANAGE);
    const parsed = createBankAccountSchema.parse(input);
    const ba = await createBankAccountService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      data: parsed,
    });
    revalidatePath("/finanzas/banks");
    return ok({ id: ba.id });
  } catch (err) {
    return toActionResult(err);
  }
}
