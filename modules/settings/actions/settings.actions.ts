"use server";

import { revalidatePath } from "next/cache";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { ok, toActionResult, type ActionResult } from "@/packages/lib/errors";
import {
  companyFormSchema,
  branchFormSchema,
  ncfSequenceFormSchema,
  taxConfigFormSchema,
  type CompanyFormInput,
  type BranchFormInput,
  type NcfSequenceFormInput,
  type TaxConfigFormInput,
} from "../schemas";
import { updateCompanyService } from "../services/company.service";
import {
  createBranchService,
  updateBranchService,
  deleteBranchService,
} from "../services/branch.service";
import {
  createNcfSequenceService,
  deleteNcfSequenceService,
} from "../services/ncf.service";
import { upsertTaxService, deleteTaxService } from "../services/tax.service";

export async function updateCompanyAction(
  input: CompanyFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.PLATFORM_COMPANY_MANAGE);
    const parsed = companyFormSchema.parse(input);
    await updateCompanyService({ companyId: ctx.companyId, userId: ctx.userId, data: parsed });
    revalidatePath("/settings");
    return ok({ id: ctx.companyId });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function createBranchAction(
  input: BranchFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.PLATFORM_SETTINGS_MANAGE);
    const parsed = branchFormSchema.parse(input);
    const b = await createBranchService({ companyId: ctx.companyId, userId: ctx.userId, data: parsed });
    revalidatePath("/settings/branches");
    return ok({ id: b.id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function updateBranchAction(
  id: string,
  input: BranchFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.PLATFORM_SETTINGS_MANAGE);
    const parsed = branchFormSchema.parse(input);
    await updateBranchService({ companyId: ctx.companyId, userId: ctx.userId, id, data: parsed });
    revalidatePath("/settings/branches");
    return ok({ id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function deleteBranchAction(id: string): Promise<ActionResult<{ ok: true }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.PLATFORM_SETTINGS_MANAGE);
    await deleteBranchService({ companyId: ctx.companyId, userId: ctx.userId, id });
    revalidatePath("/settings/branches");
    return ok({ ok: true });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function createNcfSequenceAction(
  input: NcfSequenceFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FACTURACION_NCF_MANAGE);
    const parsed = ncfSequenceFormSchema.parse(input);
    const seq = await createNcfSequenceService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      data: parsed,
    });
    revalidatePath("/settings/ncf");
    return ok({ id: seq.id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function deleteNcfSequenceAction(id: string): Promise<ActionResult<{ ok: true }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FACTURACION_NCF_MANAGE);
    await deleteNcfSequenceService({ companyId: ctx.companyId, userId: ctx.userId, id });
    revalidatePath("/settings/ncf");
    return ok({ ok: true });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function upsertTaxAction(
  input: TaxConfigFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.PLATFORM_SETTINGS_MANAGE);
    const parsed = taxConfigFormSchema.parse(input);
    const t = await upsertTaxService({ companyId: ctx.companyId, userId: ctx.userId, data: parsed });
    revalidatePath("/settings/taxes");
    return ok({ id: t.id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function deleteTaxAction(id: string): Promise<ActionResult<{ ok: true }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.PLATFORM_SETTINGS_MANAGE);
    await deleteTaxService({ companyId: ctx.companyId, userId: ctx.userId, id });
    revalidatePath("/settings/taxes");
    return ok({ ok: true });
  } catch (err) {
    return toActionResult(err);
  }
}
