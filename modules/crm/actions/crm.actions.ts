"use server";

import { revalidatePath } from "next/cache";
import { LeadStage } from "@prisma/client";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { ok, toActionResult, type ActionResult } from "@/packages/lib/errors";
import {
  leadFormSchema,
  projectFormSchema,
  type LeadFormInput,
  type ProjectFormInput,
} from "../schemas";
import {
  createLeadService,
  updateLeadService,
  setLeadStageService,
  deleteLeadService,
} from "../services/lead.service";
import {
  createProjectService,
  updateProjectService,
} from "../services/project.service";

export async function createLeadAction(
  input: LeadFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.CRM_LEAD_MANAGE);
    const parsed = leadFormSchema.parse(input);
    const l = await createLeadService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      data: parsed,
    });
    revalidatePath("/crm/leads");
    return ok({ id: l.id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function updateLeadAction(
  id: string,
  input: LeadFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.CRM_LEAD_MANAGE);
    const parsed = leadFormSchema.parse(input);
    await updateLeadService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      id,
      data: parsed,
    });
    revalidatePath("/crm/leads");
    revalidatePath(`/crm/leads/${id}`);
    return ok({ id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function setLeadStageAction(
  id: string,
  stage: LeadStage,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.CRM_LEAD_MANAGE);
    await setLeadStageService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      id,
      stage,
    });
    revalidatePath("/crm/leads");
    return ok({ id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function deleteLeadAction(id: string): Promise<ActionResult<{ ok: true }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.CRM_LEAD_MANAGE);
    await deleteLeadService({ companyId: ctx.companyId, userId: ctx.userId, id });
    revalidatePath("/crm/leads");
    return ok({ ok: true });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function createProjectAction(
  input: ProjectFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.CRM_PROJECT_MANAGE);
    const parsed = projectFormSchema.parse(input);
    const p = await createProjectService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      data: parsed,
    });
    revalidatePath("/crm/projects");
    return ok({ id: p.id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function updateProjectAction(
  id: string,
  input: ProjectFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.CRM_PROJECT_MANAGE);
    const parsed = projectFormSchema.parse(input);
    await updateProjectService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      id,
      data: parsed,
    });
    revalidatePath("/crm/projects");
    revalidatePath(`/crm/projects/${id}`);
    return ok({ id });
  } catch (err) {
    return toActionResult(err);
  }
}
