"use client";

import { useRouter } from "next/navigation";
import { formatCurrency } from "@/packages/lib/decimal";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Customer } from "@prisma/client";

type Props = { customers: Customer[] };

const TYPE_LABEL: Record<string, string> = {
  INDIVIDUAL: "Individual",
  COMPANY: "Empresa",
  FINAL_CONSUMER: "Cons. Final",
};

export function CustomersTable({ customers }: Props) {
  const router = useRouter();

  const columns: Column<Customer>[] = [
    {
      key: "legalName",
      header: "Cliente",
      searchAccessor: (c) => `${c.legalName} ${c.tradeName ?? ""} ${c.documentNumber ?? ""}`,
      cell: (c) => (
        <div className="flex flex-col">
          <span className="font-medium">{c.legalName}</span>
          {c.tradeName && (
            <span className="text-xs text-muted-foreground">{c.tradeName}</span>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      cell: (c) => (
        <Badge variant="secondary" className="text-xs">
          {TYPE_LABEL[c.type] ?? c.type}
        </Badge>
      ),
    },
    {
      key: "documentNumber",
      header: "RNC/Cédula",
      cell: (c) => (
        <span className="font-mono text-xs">{c.documentNumber ?? "—"}</span>
      ),
    },
    {
      key: "email",
      header: "Contacto",
      cell: (c) => (
        <div className="flex flex-col text-xs">
          <span>{c.email ?? "—"}</span>
          <span className="text-muted-foreground">{c.phone ?? c.mobile ?? ""}</span>
        </div>
      ),
    },
    {
      key: "balanceDue",
      header: "Saldo",
      align: "right",
      cell: (c) => (
        <span className={c.balanceDue.toString() !== "0" ? "font-medium text-warning" : "text-muted-foreground"}>
          {formatCurrency(c.balanceDue.toString())}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Estado",
      cell: (c) => <StatusBadge status={c.isActive ? "ACTIVE" : "INACTIVE"} />,
    },
  ];

  return (
    <DataTable
      data={customers}
      columns={columns}
      rowKey={(c) => c.id}
      searchPlaceholder="Buscar por nombre, RNC, email..."
      emptyMessage="No hay clientes registrados todavía"
      onRowClick={(c) => router.push(`/facturacion/customers/${c.id}`)}
    />
  );
}
