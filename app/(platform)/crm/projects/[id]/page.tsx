import { notFound } from "next/navigation";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { prisma } from "@/packages/db";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectForm } from "@/modules/crm/components/project-form";
import { getProjectService } from "@/modules/crm/services/project.service";
import { isAppError } from "@/packages/lib/errors";

export const metadata = { title: "Editar proyecto" };

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.CRM_PROJECT_MANAGE);

  let project;
  try {
    project = await getProjectService(ctx.companyId, params.id);
  } catch (err) {
    if (isAppError(err) && err.code === "NOT_FOUND") notFound();
    throw err;
  }

  const customers = await prisma.customer.findMany({
    where: { companyId: ctx.companyId, deletedAt: null },
    select: { id: true, legalName: true },
    orderBy: { legalName: "asc" },
  });

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.customer.legalName}
        breadcrumbs={[
          { label: "CRM", href: "/crm" },
          { label: "Proyectos", href: "/crm/projects" },
          { label: project.name },
        ]}
      />
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        <ProjectForm
          mode="edit"
          id={project.id}
          customers={customers}
          defaultValues={{
            customerId: project.customerId,
            name: project.name,
            description: project.description,
            status: project.status,
            startDate: project.startDate,
            endDate: project.endDate,
            amount: project.amount ? Number(project.amount) : null,
          }}
        />
      </div>
    </div>
  );
}
