"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { ok, fail, toActionResult, type ActionResult } from "@/packages/lib/errors";
import {
  galleryFormSchema,
  verifyGalleryPasswordSchema,
  type GalleryFormInput,
} from "../schemas";
import {
  createGalleryService,
  updateGalleryService,
  deleteGalleryService,
  verifyGalleryPasswordService,
} from "../services/gallery.service";

export async function createGalleryAction(
  input: GalleryFormInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.GALLERY_CREATE);
    const parsed = galleryFormSchema.parse(input);
    const g = await createGalleryService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      data: parsed,
    });
    revalidatePath("/gallery");
    return ok({ id: g.id, slug: g.slug });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function updateGalleryAction(
  id: string,
  input: GalleryFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.GALLERY_PUBLISH);
    const parsed = galleryFormSchema.parse(input);
    await updateGalleryService({
      companyId: ctx.companyId,
      userId: ctx.userId,
      id,
      data: parsed,
    });
    revalidatePath("/gallery");
    revalidatePath(`/gallery/${id}`);
    return ok({ id });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function deleteGalleryAction(id: string): Promise<ActionResult<{ ok: true }>> {
  try {
    const ctx = await requireCompany();
    requirePermission(ctx, PERMISSIONS.GALLERY_DELETE);
    await deleteGalleryService({ companyId: ctx.companyId, userId: ctx.userId, id });
    revalidatePath("/gallery");
    return ok({ ok: true });
  } catch (err) {
    return toActionResult(err);
  }
}

export async function unlockGalleryAction(input: {
  slug: string;
  password: string;
}): Promise<ActionResult<{ ok: true }>> {
  try {
    const parsed = verifyGalleryPasswordSchema.parse(input);
    const g = await verifyGalleryPasswordService(parsed.slug, parsed.password);
    if (!g) return fail("UNAUTHORIZED", "Contraseña incorrecta");
    cookies().set(`gallery-${parsed.slug}`, "ok", {
      httpOnly: true,
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
      path: "/",
    });
    return ok({ ok: true });
  } catch (err) {
    return toActionResult(err);
  }
}
