"use server";

import { revalidatePath } from "next/cache";
import { DeliveryStatus } from "@prisma/client";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { ok, toActionResult, type ActionResult } from "@/packages/lib/errors";
import {
  createDeliverySchema,
  type CreateDeliveryInput,
} from "../schemas/delivery.schema";
import {
  createDeliveryService,
  updateDeliveryStatusService,
} from "../services/delivery.service";

export async function createDeliveryAction(
  input: CreateDeliveryInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FACTURACION_DELIVERY_MANAGE);
    const parsed = createDeliverySchema.parse(input);
    const d = await createDeliveryService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      input: parsed,
    });
    revalidatePath("/facturacion/deliveries");
    return ok({ id: d.id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function setDeliveryStatusAction(
  id: string,
  status: DeliveryStatus,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.FACTURACION_DELIVERY_MANAGE);
    await updateDeliveryStatusService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      id,
      status,
    });
    revalidatePath(`/facturacion/deliveries/${id}`);
    return ok({ id });
  } catch (err) {
    return toActionResult(err);
  }
}
