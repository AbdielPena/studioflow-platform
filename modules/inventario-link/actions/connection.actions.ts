"use server";

import { revalidatePath } from "next/cache";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { ok, toActionResult, type ActionResult } from "@/packages/lib/errors";
import { connectionFormSchema, type ConnectionFormInput } from "../schemas/connection.schema";
import {
  upsertConnectionService,
  deleteConnectionService,
  testConnectionService,
} from "../services/connection.service";
import { runJob } from "../services/sync.service";

export async function upsertConnectionAction(
  input: ConnectionFormInput & { id?: string },
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.INVENTORY_LINK_CONFIGURE);
    const { id, ...rest } = input;
    const parsed = connectionFormSchema.parse(rest);
    const c = await upsertConnectionService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      id,
      data: parsed,
    });
    revalidatePath("/inventario-link");
    return ok({ id: c.id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function deleteConnectionAction(id: string): Promise<ActionResult<{ ok: true }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.INVENTORY_LINK_CONFIGURE);
    await deleteConnectionService({ companyId: ctx.companyId, userId: ctx.userId, id });
    revalidatePath("/inventario-link");
    return ok({ ok: true });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function testConnectionAction(
  id: string,
): Promise<ActionResult<{ ok: boolean; durationMs: number; error: string | null }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.INVENTORY_LINK_CONFIGURE);
    const r = await testConnectionService({ companyId: ctx.companyId, id });
    revalidatePath("/inventario-link");
    return ok(r);
  } catch (err) {
    return toActionResult(err);
  }
}

export async function runJobAction(jobId: string): Promise<ActionResult<{ ok: true }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.INVENTORY_LINK_SYNC);
    await runJob(jobId);
    revalidatePath("/inventario-link");
    return ok({ ok: true });
  } catch (err) {
    return toActionResult(err);
  }
}
