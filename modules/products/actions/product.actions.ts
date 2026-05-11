"use server";

import { revalidatePath } from "next/cache";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { ok, toActionResult, type ActionResult } from "@/packages/lib/errors";
import {
  productFormSchema,
  productCategoryFormSchema,
  type ProductFormInput,
  type ProductCategoryFormInput,
} from "../schemas/product.schema";
import {
  createProductService,
  updateProductService,
  deleteProductService,
  createCategoryService,
} from "../services/product.service";

export async function createProductAction(
  input: ProductFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FACTURACION_PRODUCT_MANAGE);
    const parsed = productFormSchema.parse(input);
    const p = await createProductService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      data: parsed,
    });
    revalidatePath("/facturacion/products");
    return ok({ id: p.id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function updateProductAction(
  id: string,
  input: ProductFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FACTURACION_PRODUCT_MANAGE);
    const parsed = productFormSchema.parse(input);
    await updateProductService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      id,
      data: parsed,
    });
    revalidatePath("/facturacion/products");
    revalidatePath(`/facturacion/products/${id}`);
    return ok({ id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function deleteProductAction(id: string): Promise<ActionResult<{ ok: true }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FACTURACION_PRODUCT_MANAGE);
    await deleteProductService({ companyId: ctx.companyId, userId: ctx.userId, id });
    revalidatePath("/facturacion/products");
    return ok({ ok: true });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function createCategoryAction(
  input: ProductCategoryFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FACTURACION_PRODUCT_MANAGE);
    const parsed = productCategoryFormSchema.parse(input);
    const c = await createCategoryService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      data: parsed,
    });
    revalidatePath("/facturacion/products");
    return ok({ id: c.id });
  } catch (err) {
    return toActionResult(err);
  }
}
