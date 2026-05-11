"use client";

import { useRouter } from "next/navigation";
import { formatCurrency } from "@/packages/lib/decimal";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Purchase, Supplier } from "@prisma/client";

type Row = Purchase & { supplier: Supplier };

export function PurchasesTable({ purchases }: { purchases: Row[] }) {
  const router = useRouter();

  const columns: Column<Row>[] = [
    {
      key: "number",
      header: "Número",
      searchAccessor: (p) => `${p.number} ${p.ncfSupplier ?? ""} ${p.supplier.legalName}`,
      cell: (p) => (
        <div className="flex flex-col">
          <span className="font-mono text-sm font-medium">{p.number}</span>
          {p.ncfSupplier && (
            <span className="font-mono text-xs text-muted-foreground">{p.ncfSupplier}</span>
          )}
        </div>
      ),
    },
    { key: "supplier", header: "Suplidor", cell: (p) => p.supplier.legalName },
    {
      key: "date",
      header: "Fecha",
      cell: (p) => (
        <span className="text-xs">{new Date(p.issueDate).toLocaleDateString("es-DO")}</span>
      ),
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      cell: (p) => <span className="font-mono font-medium">{formatCurrency(p.total.toString())}</span>,
    },
    {
      key: "balance",
      header: "Por pagar",
      align: "right",
      cell: (p) => (
        <span className={Number(p.balanceDue) > 0 ? "font-mono font-medium text-warning" : "font-mono text-muted-foreground"}>
          {formatCurrency(p.balanceDue.toString())}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (p) => <StatusBadge status={p.status} />,
    },
  ];

  return (
    <DataTable
      data={purchases}
      columns={columns}
      rowKey={(p) => p.id}
      searchPlaceholder="Buscar compra..."
      emptyMessage="Sin compras registradas."
      onRowClick={(p) => router.push(`/facturacion/purchases/${p.id}`)}
    />
  );
}
