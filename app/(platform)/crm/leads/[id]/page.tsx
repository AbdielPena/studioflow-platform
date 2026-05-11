import { notFound } from "next/navigation";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { prisma } from "@/packages/db";
import { PageHeader } from "@/components/shared/page-header";
import { LeadForm } from "@/modules/crm/components/lead-form";
import { getLeadService } from "@/modules/crm/services/lead.service";
import { isAppError } from "@/packages/lib/errors";

export const metadata = { title: "Editar lead" };

export default async function EditLeadPage({ params }: { params: { id: string } }) {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.CRM_LEAD_MANAGE);

  let lead;
  try {
    lead = await getLeadService(ctx.companyId, params.id);
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
        title={lead.name}
        breadcrumbs={[
          { label: "CRM", href: "/crm" },
          { label: "Leads", href: "/crm/leads" },
          { label: lead.name },
        ]}
      />
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        <LeadForm
          mode="edit"
          id={lead.id}
          customers={customers}
          defaultValues={{
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            source: lead.source,
            stage: lead.stage,
            estimatedValue: lead.estimatedValue ? Number(lead.estimatedValue) : null,
            customerId: lead.customerId,
            notes: lead.notes,
          }}
        />
      </div>
    </div>
  );
}
