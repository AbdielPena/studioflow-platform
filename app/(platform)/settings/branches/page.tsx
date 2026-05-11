import Link from "next/link";
import { Plus, MapPin, Star } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { listBranchesService } from "@/modules/settings/services/branch.service";
import type { Branch } from "@prisma/client";
import { BranchRowActions } from "@/modules/settings/components/branch-row-actions";

export const metadata = { title: "Sucursales" };

export default async function BranchesPage() {
  const ctx = await requireCompany();
  const branches = await listBranchesService(ctx.companyId);

  const columns: Column<Branch>[] = [
    {
      key: "code",
      header: "Código",
      cell: (b) => <span className="font-mono text-xs font-medium">{b.code}</span>,
    },
    {
      key: "name",
      header: "Nombre",
      searchAccessor: (b) => `${b.code} ${b.name}`,
      cell: (b) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{b.name}</span>
          {b.isMain && (
            <Badge variant="info" className="text-[10px]">
              <Star className="h-3 w-3" /> Principal
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Teléfono",
      cell: (b) => <span className="text-xs">{b.phone ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Estado",
      cell: (b) => <StatusBadge status={b.isActive ? "ACTIVE" : "INACTIVE"} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (b) => <BranchRowActions branchId={b.id} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Sucursales"
        description="Administra las sucursales de tu empresa."
        breadcrumbs={[
          { label: "Configuración", href: "/settings" },
          { label: "Sucursales" },
        ]}
        actions={
          <Button asChild>
            <Link href="/settings/branches/new">
              <Plus className="h-4 w-4" />
              Nueva sucursal
            </Link>
          </Button>
        }
      />
      <div className="p-6 lg:p-8">
        {branches.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="Sin sucursales todavía"
            actionLabel="Crear primera sucursal"
            actionHref="/settings/branches/new"
          />
        ) : (
          <DataTable
            data={branches}
            columns={columns}
            rowKey={(b) => b.id}
            searchPlaceholder="Buscar sucursal..."
          />
        )}
      </div>
    </div>
  );
}
