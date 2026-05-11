"use server";

import { revalidatePath } from "next/cache";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { ok, toActionResult, type ActionResult } from "@/packages/lib/errors";
import { supplierFormSchema, type SupplierFormInput } from "../schemas/supplier.schema";
import {
  createSupplierService,
  updateSupplierService,
  deleteSupplierService,
} from "../services/supplier.service";

export async function createSupplierAction(
  input: SupplierFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.SUPPLIER_MANAGE);
    const parsed = supplierFormSchema.parse(input);
    const s = await createSupplierService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      data: parsed,
    });
    revalidatePath("/facturacion/suppliers");
    return ok({ id: s.id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function updateSupplierAction(
  id: string,
  input: SupplierFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.SUPPLIER_MANAGE);
    const parsed = supplierFormSchema.parse(input);
    await updateSupplierService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      id,
      data: parsed,
    });
    revalidatePath("/facturacion/suppliers");
    revalidatePath(`/facturacion/suppliers/${id}`);
    return ok({ id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function deleteSupplierAction(id: string): Promise<ActionResult<{ ok: true }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.SUPPLIER_MANAGE);
    await deleteSupplierService({ companyId: ctx.companyId, userId: ctx.userId, id });
    revalidatePath("/facturacion/suppliers");
    return ok({ ok: true });
  } catch (err) {
    return toActionResult(err);
  }
}
