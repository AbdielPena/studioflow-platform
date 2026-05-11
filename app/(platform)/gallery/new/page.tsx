import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { prisma } from "@/packages/db";
import { PageHeader } from "@/components/shared/page-header";
import { GalleryForm } from "@/modules/gallery/components/gallery-form";

export const metadata = { title: "Nueva galería" };

export default async function NewGalleryPage() {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.GALLERY_CREATE);

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
        title="Nueva galería"
        breadcrumbs={[
          { label: "Galerías", href: "/gallery" },
          { label: "Nueva" },
        ]}
      />
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        <GalleryForm mode="create" customers={customers} projects={projects} />
      </div>
    </div>
  );
}
