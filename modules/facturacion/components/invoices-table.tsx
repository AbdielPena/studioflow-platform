"use client";

import { useRouter } from "next/navigation";
import { formatCurrency } from "@/packages/lib/decimal";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Invoice, Customer, NcfSequence } from "@prisma/client";

type Row = Invoice & { customer: Customer; ncfSequence: NcfSequence | null };

export function InvoicesTable({ invoices }: { invoices: Row[] }) {
  const router = useRouter();

  const columns: Column<Row>[] = [
    {
      key: "number",
      header: "Número",
      searchAccessor: (i) => `${i.number} ${i.ncf ?? ""} ${i.customer.legalName}`,
      cell: (i) => (
        <div className="flex flex-col">
          <span className="font-mono text-sm font-medium">{i.number}</span>
          {i.ncf && (
            <span className="font-mono text-xs text-muted-foreground">{i.ncf}</span>
          )}
        </div>
      ),
    },
    {
      key: "customer",
      header: "Cliente",
      cell: (i) => (
        <span className="text-sm">{i.customer.legalName}</span>
      ),
    },
    {
      key: "date",
      header: "Fecha",
      cell: (i) => (
        <span className="text-xs">{new Date(i.issueDate).toLocaleDateString("es-DO")}</span>
      ),
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      cell: (i) => <span className="font-mono font-medium">{formatCurrency(i.total.toString())}</span>,
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      cell: (i) => {
        const balance = Number(i.balanceDue);
        return (
          <span
            className={`font-mono ${balance > 0 ? "font-medium text-warning" : "text-muted-foreground"}`}
          >
            {formatCurrency(i.balanceDue.toString())}
          </span>
        );
      },
    },
    {
      key: "sync",
      header: "Inv. externo",
      cell: (i) => <StatusBadge status={i.inventorySyncStatus} />,
    },
    {
      key: "status",
      header: "Estado",
      cell: (i) => <StatusBadge status={i.status} />,
    },
  ];

  return (
    <DataTable
      data={invoices}
      columns={columns}
      rowKey={(i) => i.id}
      searchPlaceholder="Buscar por número, NCF, cliente..."
      emptyMessage="Sin facturas todavía."
      onRowClick={(i) => router.push(`/facturacion/invoices/${i.id}`)}
    />
  );
}
