import { notFound } from "next/navigation";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { prisma } from "@/packages/db";
import { PageHeader } from "@/components/shared/page-header";
import { GalleryForm } from "@/modules/gallery/components/gallery-form";
import { getGalleryService } from "@/modules/gallery/services/gallery.service";
import { isAppError } from "@/packages/lib/errors";

export const metadata = { title: "Editar galería" };

export default async function EditGalleryPage({ params }: { params: { id: string } }) {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.GALLERY_PUBLISH);

  let gallery;
  try {
    gallery = await getGalleryService(ctx.companyId, params.id);
  } catch (err) {
    if (isAppError(err) && err.code === "NOT_FOUND") notFound();
    throw err;
  }

  const [customers, projects] = await Promise.all([
    prisma.customer.findMany({
      where: { companyId: ctx.companyId, deletedAt: null },
      select: { id: true, legalName: true },
      orderBy: { legalName: "asc" },
    }),
    prisma.project.findMany({
      where: { companyId: ctx.companyId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={gallery.title}
        description={`/g/${gallery.slug}`}
        breadcrumbs={[
          { label: "Galerías", href: "/gallery" },
          { label: gallery.title },
        ]}
      />
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        <GalleryForm
          mode="edit"
          id={gallery.id}
          customers={customers}
          projects={projects}
          defaultValues={{
            title: gallery.title,
            slug: gallery.slug,
            description: gallery.description,
            coverUrl: gallery.coverUrl,
            customerId: gallery.customerId,
            projectId: gallery.projectId,
            status: gallery.status,
            password: null,
            expiresAt: gallery.expiresAt,
            isPublic: gallery.isPublic,
          }}
        />
      </div>
    </div>
  );
}
