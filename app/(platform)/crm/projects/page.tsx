import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ProjectsTable } from "@/modules/crm/components/projects-table";
import { listProjectsService } from "@/modules/crm/services/project.service";

export const metadata = { title: "Proyectos" };

export default async function ProjectsPage() {
  const ctx = await requireCompany();
  const projects = await listProjectsService(ctx.companyId);

  return (
    <div>
      <PageHeader
        title="Proyectos"
        description="Sesiones fotográficas, eventos, trabajos."
        breadcrumbs={[{ label: "CRM", href: "/crm" }, { label: "Proyectos" }]}
        actions={
          <Button asChild>
            <Link href="/crm/projects/new">
              <Plus className="h-4 w-4" />
              Nuevo proyecto
            </Link>
          </Button>
        }
      />
      <div className="p-6 lg:p-8">
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Sin proyectos"
            actionLabel="Crear proyecto"
            actionHref="/crm/projects/new"
          />
        ) : (
          <ProjectsTable projects={projects} />
        )}
      </div>
    </div>
  );
}
