"use server";

import { revalidatePath } from "next/cache";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { ok, toActionResult, type ActionResult } from "@/packages/lib/errors";
import {
  createPurchaseSchema,
  type CreatePurchaseInput,
} from "../schemas/purchase.schema";
import {
  createPurchaseService,
  addPayablePaymentService,
} from "../services/purchase.service";

export async function createPurchaseAction(
  input: CreatePurchaseInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.PURCHASE_CREATE);
    const parsed = createPurchaseSchema.parse(input);
    const p = await createPurchaseService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      input: parsed,
    });
    revalidatePath("/facturacion/purchases");
    return ok({ id: p.id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function addPayablePaymentAction(input: {
  payableId: string;
  amount: number;
  method: "CASH" | "CARD" | "TRANSFER" | "CHECK" | "DIGITAL_WALLET" | "OTHER";
  reference?: string | null;
  bankAccountId?: string | null;
}): Promise<ActionResult<{ ok: true }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FINANZAS_PAYABLE_MANAGE);
    await addPayablePaymentService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      ...input,
    });
    revalidatePath("/finanzas/payables");
    return ok({ ok: true });
  } catch (err) {
    return toActionResult(err);
  }
}
