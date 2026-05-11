import Link from "next/link";
import { Users, FolderKanban, ArrowRight } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { prisma } from "@/packages/db";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "CRM" };

export default async function CrmPage() {
  const ctx = await requireCompany();
  const [leadsCount, projectsCount, customersCount] = await Promise.all([
    prisma.crmLead.count({ where: { companyId: ctx.companyId, deletedAt: null } }),
    prisma.project.count({ where: { companyId: ctx.companyId, deletedAt: null } }),
    prisma.customer.count({ where: { companyId: ctx.companyId, deletedAt: null } }),
  ]);

  return (
    <div>
      <PageHeader
        title="CRM"
        description="Gestión de leads, proyectos y relación con clientes."
        breadcrumbs={[{ label: "CRM" }]}
      />
      <div className="grid gap-4 p-6 md:grid-cols-3 lg:p-8">
        <Link href="/crm/leads">
          <Card className="transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardTitle className="mt-3">Leads</CardTitle>
              <CardDescription>Pipeline kanban con etapas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{leadsCount}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/crm/projects">
          <Card className="transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info/10 text-info">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardTitle className="mt-3">Proyectos</CardTitle>
              <CardDescription>Sesiones, eventos y trabajos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{projectsCount}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/facturacion/customers">
          <Card className="transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                  <Users className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardTitle className="mt-3">Clientes</CardTitle>
              <CardDescription>Base de clientes activa</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{customersCount}</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
