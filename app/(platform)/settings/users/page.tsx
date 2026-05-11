import { Users } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { prisma } from "@/packages/db";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";

export const metadata = { title: "Usuarios" };

export default async function UsersPage() {
  const ctx = await requireCompany();

  const members = await prisma.companyMember.findMany({
    where: { companyId: ctx.companyId, deletedAt: null },
    include: { user: true, role: true, branch: true },
    orderBy: { createdAt: "asc" },
  });

  type Row = (typeof members)[number];

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Usuario",
      searchAccessor: (m) => `${m.user.name ?? ""} ${m.user.email}`,
      cell: (m) => (
        <div className="flex flex-col">
          <span className="font-medium">{m.user.name ?? "Sin nombre"}</span>
          <span className="text-xs text-muted-foreground">{m.user.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rol",
      cell: (m) => (
        <Badge variant="secondary">
          {m.isOwner ? "Owner" : m.role?.name ?? m.user.systemRole}
        </Badge>
      ),
    },
    {
      key: "branch",
      header: "Sucursal",
      cell: (m) => <span className="text-xs">{m.branch?.name ?? "Todas"}</span>,
    },
    {
      key: "lastLogin",
      header: "Último acceso",
      cell: (m) => (
        <span className="text-xs">
          {m.user.lastLoginAt
            ? new Date(m.user.lastLoginAt).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" })
            : "Nunca"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (m) => <StatusBadge status={m.isActive && m.user.isActive ? "ACTIVE" : "INACTIVE"} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Usuarios y roles"
        description="Miembros con acceso a esta empresa."
        breadcrumbs={[
          { label: "Configuración", href: "/settings" },
          { label: "Usuarios" },
        ]}
      />
      <div className="p-6 lg:p-8">
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin miembros activos.</p>
        ) : (
          <DataTable
            data={members}
            columns={columns}
            rowKey={(m) => m.id}
            searchPlaceholder="Buscar usuario..."
          />
        )}
      </div>
    </div>
  );
}
