"use client";

import { useRouter } from "next/navigation";
import { formatCurrency } from "@/packages/lib/decimal";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Quote, Customer } from "@prisma/client";

type Row = Quote & { customer: Customer };

export function QuotesTable({ quotes }: { quotes: Row[] }) {
  const router = useRouter();

  const columns: Column<Row>[] = [
    {
      key: "number",
      header: "Número",
      searchAccessor: (q) => `${q.number} ${q.customer.legalName}`,
      cell: (q) => <span className="font-mono text-sm font-medium">{q.number}</span>,
    },
    { key: "customer", header: "Cliente", cell: (q) => q.customer.legalName },
    {
      key: "date",
      header: "Emisión",
      cell: (q) => <span className="text-xs">{new Date(q.issueDate).toLocaleDateString("es-DO")}</span>,
    },
    {
      key: "expires",
      header: "Vence",
      cell: (q) => (
        <span className="text-xs">
          {q.expiresAt ? new Date(q.expiresAt).toLocaleDateString("es-DO") : "—"}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      cell: (q) => <span className="font-mono font-medium">{formatCurrency(q.total.toString())}</span>,
    },
    {
      key: "status",
      header: "Estado",
      cell: (q) => <StatusBadge status={q.status} />,
    },
  ];

  return (
    <DataTable
      data={quotes}
      columns={columns}
      rowKey={(q) => q.id}
      searchPlaceholder="Buscar cotización..."
      emptyMessage="Sin cotizaciones."
      onRowClick={(q) => router.push(`/facturacion/quotes/${q.id}`)}
    />
  );
}
