import bcrypt from "bcryptjs";
import { AuditAction } from "@prisma/client";
import { prisma } from "@/packages/db";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { publish } from "@/packages/events/bus";
import type { GalleryFormOutput } from "../schemas";

export const listGalleriesService = (companyId: string) =>
  prisma.gallery.findMany({
    where: { companyId, deletedAt: null },
    include: { customer: true, project: true, photos: { take: 1 } },
    orderBy: { createdAt: "desc" },
  });

export async function getGalleryService(companyId: string, id: string) {
  const g = await prisma.gallery.findFirst({
    where: { id, companyId, deletedAt: null },
    include: { customer: true, project: true, photos: { orderBy: { position: "asc" } } },
  });
  if (!g) throw new AppError({ code: "NOT_FOUND", message: "Galería no encontrada" });
  return g;
}

export async function getPublicGalleryService(slug: string) {
  return prisma.gallery.findFirst({
    where: { slug, deletedAt: null, status: "PUBLISHED" },
    include: { photos: { orderBy: { position: "asc" } }, company: true },
  });
}

export async function createGalleryService(opts: {
  companyId: string;
  userId: string;
  data: GalleryFormOutput;
}) {
  const passwordHash = opts.data.password
    ? await bcrypt.hash(opts.data.password, 10)
    : null;

  const exists = await prisma.gallery.findFirst({
    where: { companyId: opts.companyId, slug: opts.data.slug, deletedAt: null },
  });
  if (exists) {
    throw new AppError({
      code: "CONFLICT",
      message: `El slug "${opts.data.slug}" ya está en uso`,
    });
  }

  const g = await prisma.gallery.create({
    data: {
      companyId: opts.companyId,
      title: opts.data.title,
      slug: opts.data.slug,
      description: opts.data.description || null,
      coverUrl: opts.data.coverUrl || null,
      customerId: opts.data.customerId || null,
      projectId: opts.data.projectId || null,
      status: opts.data.status,
      password: passwordHash,
      expiresAt: opts.data.expiresAt ?? null,
      isPublic: opts.data.isPublic,
    },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.CREATE,
    module: "gallery",
    entityType: "Gallery",
    entityId: g.id,
    after: { title: g.title, slug: g.slug },
  });
  if (g.status === "PUBLISHED") {
    await publish("gallery.published", { galleryId: g.id, companyId: opts.companyId });
  }
  return g;
}

export async function updateGalleryService(opts: {
  companyId: string;
  userId: string;
  id: string;
  data: GalleryFormOutput;
}) {
  const before = await getGalleryService(opts.companyId, opts.id);
  const passwordHash = opts.data.password
    ? await bcrypt.hash(opts.data.password, 10)
    : opts.data.password === ""
      ? null
      : undefined;

  const updated = await prisma.gallery.update({
    where: { id: opts.id },
    data: {
      title: opts.data.title,
      slug: opts.data.slug,
      description: opts.data.description || null,
      coverUrl: opts.data.coverUrl || null,
      customerId: opts.data.customerId || null,
      projectId: opts.data.projectId || null,
      status: opts.data.status,
      ...(passwordHash !== undefined ? { password: passwordHash } : {}),
      expiresAt: opts.data.expiresAt ?? null,
      isPublic: opts.data.isPublic,
    },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.UPDATE,
    module: "gallery",
    entityType: "Gallery",
    entityId: opts.id,
    after: { status: updated.status },
  });
  if (before.status !== "PUBLISHED" && updated.status === "PUBLISHED") {
    await publish("gallery.published", { galleryId: updated.id, companyId: opts.companyId });
  }
  return updated;
}

export async function deleteGalleryService(opts: {
  companyId: string;
  userId: string;
  id: string;
}) {
  await prisma.gallery.update({
    where: { id: opts.id },
    data: { deletedAt: new Date() },
  });
  await audit({
    companyId: opts.companyId,
    userId: opts.userId,
    action: AuditAction.DELETE,
    module: "gallery",
    entityType: "Gallery",
    entityId: opts.id,
  });
}

export async function verifyGalleryPasswordService(slug: string, password: string) {
  const g = await prisma.gallery.findFirst({
    where: { slug, deletedAt: null, status: "PUBLISHED" },
  });
  if (!g) return null;
  if (!g.password) return g;
  const ok = await bcrypt.compare(password, g.password);
  return ok ? g : null;
}
