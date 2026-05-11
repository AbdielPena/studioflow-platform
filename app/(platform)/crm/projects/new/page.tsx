import { redirect } from "next/navigation";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { prisma } from "@/packages/db";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectForm } from "@/modules/crm/components/project-form";

export const metadata = { title: "Nuevo proyecto" };

export default async function NewProjectPage() {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.CRM_PROJECT_MANAGE);

  const customers = await prisma.customer.findMany({
    where: { companyId: ctx.companyId, deletedAt: null },
    select: { id: true, legalName: true },
    orderBy: { legalName: "asc" },
  });

  if (customers.length === 0) redirect("/facturacion/customers/new?from=project");

  return (
    <div>
      <PageHeader
        title="Nuevo proyecto"
        breadcrumbs={[
          { label: "CRM", href: "/crm" },
          { label: "Proyectos", href: "/crm/projects" },
          { label: "Nuevo" },
        ]}
      />
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        <ProjectForm mode="create" customers={customers} />
      </div>
    </div>
  );
}
