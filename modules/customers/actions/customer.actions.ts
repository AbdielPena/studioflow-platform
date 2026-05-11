"use server";

import { revalidatePath } from "next/cache";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { ok, toActionResult, type ActionResult } from "@/packages/lib/errors";
import { customerFormSchema, type CustomerFormInput } from "../schemas/customer.schema";
import {
  createCustomerService,
  updateCustomerService,
  deleteCustomerService,
} from "../services/customer.service";

export async function createCustomerAction(
  input: CustomerFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FACTURACION_CUSTOMER_MANAGE);
    const parsed = customerFormSchema.parse(input);
    const customer = await createCustomerService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      data: parsed,
    });
    revalidatePath("/facturacion/customers");
    return ok({ id: customer.id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function updateCustomerAction(
  id: string,
  input: CustomerFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FACTURACION_CUSTOMER_MANAGE);
    const parsed = customerFormSchema.parse(input);
    await updateCustomerService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      id,
      data: parsed,
    });
    revalidatePath("/facturacion/customers");
    revalidatePath(`/facturacion/customers/${id}`);
    return ok({ id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function deleteCustomerAction(
  id: string,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FACTURACION_CUSTOMER_MANAGE);
    await deleteCustomerService({ companyId: ctx.companyId, userId: ctx.userId, id });
    revalidatePath("/facturacion/customers");
    return ok({ ok: true });
  } catch (err) {
    return toActionResult(err);
  }
}
