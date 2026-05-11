import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LeadsKanban } from "@/modules/crm/components/leads-kanban";
import { listLeadsService } from "@/modules/crm/services/lead.service";

export const metadata = { title: "Leads" };

export default async function LeadsPage() {
  const ctx = await requireCompany();
  const leads = await listLeadsService(ctx.companyId);

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        title="Leads"
        description="Pipeline visual de oportunidades comerciales."
        breadcrumbs={[{ label: "CRM", href: "/crm" }, { label: "Leads" }]}
        actions={
          <Button asChild>
            <Link href="/crm/leads/new">
              <Plus className="h-4 w-4" />
              Nuevo lead
            </Link>
          </Button>
        }
      />
      <div className="flex-1 overflow-hidden p-4 lg:p-6">
        {leads.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin leads todavía"
            description="Captura tu primer lead para empezar el pipeline."
            actionLabel="Crear lead"
            actionHref="/crm/leads/new"
          />
        ) : (
          <LeadsKanban leads={leads} />
        )}
      </div>
    </div>
  );
}
