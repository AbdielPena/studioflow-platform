"use client";

import { useRouter } from "next/navigation";
import { formatCurrency } from "@/packages/lib/decimal";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Project, Customer } from "@prisma/client";

type Row = Project & { customer: Customer };

const STATUS_LABEL: Record<string, string> = {
  LEAD: "Lead",
  BOOKED: "Confirmado",
  IN_PROGRESS: "En proceso",
  EDITING: "En edición",
  DELIVERED: "Entregado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

export function ProjectsTable({ projects }: { projects: Row[] }) {
  const router = useRouter();

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Proyecto",
      searchAccessor: (p) => `${p.name} ${p.customer.legalName}`,
      cell: (p) => <span className="font-medium">{p.name}</span>,
    },
    { key: "customer", header: "Cliente", cell: (p) => p.customer.legalName },
    {
      key: "start",
      header: "Inicio",
      cell: (p) => (
        <span className="text-xs">
          {p.startDate ? new Date(p.startDate).toLocaleDateString("es-DO") : "—"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Monto",
      align: "right",
      cell: (p) => (
        <span className="font-mono text-xs">
          {p.amount ? formatCurrency(p.amount.toString()) : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (p) => (
        <StatusBadge status={p.status} label={STATUS_LABEL[p.status] ?? p.status} />
      ),
    },
  ];

  return (
    <DataTable
      data={projects}
      columns={columns}
      rowKey={(p) => p.id}
      searchPlaceholder="Buscar proyecto..."
      emptyMessage="Sin proyectos."
      onRowClick={(p) => router.push(`/crm/projects/${p.id}`)}
    />
  );
}
