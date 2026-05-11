import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { prisma } from "@/packages/db";
import { PageHeader } from "@/components/shared/page-header";
import { LeadForm } from "@/modules/crm/components/lead-form";

export const metadata = { title: "Nuevo lead" };

export default async function NewLeadPage() {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.CRM_LEAD_MANAGE);

  const customers = await prisma.customer.findMany({
    where: { companyId: ctx.companyId, deletedAt: null },
    select: { id: true, legalName: true },
    orderBy: { legalName: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Nuevo lead"
        breadcrumbs={[
          { label: "CRM", href: "/crm" },
          { label: "Leads", href: "/crm/leads" },
          { label: "Nuevo" },
        ]}
      />
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        <LeadForm mode="create" customers={customers} />
      </div>
    </div>
  );
}
