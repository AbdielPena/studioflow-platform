"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Delivery, Invoice, Customer } from "@prisma/client";

type Row = Delivery & { invoice: Invoice & { customer: Customer } };

export function DeliveriesTable({ deliveries }: { deliveries: Row[] }) {
  const router = useRouter();

  const columns: Column<Row>[] = [
    {
      key: "number",
      header: "Conduce",
      searchAccessor: (d) => `${d.number} ${d.invoice.number}`,
      cell: (d) => <span className="font-mono text-sm font-medium">{d.number}</span>,
    },
    {
      key: "invoice",
      header: "Factura",
      cell: (d) => (
        <Link
          href={`/facturacion/invoices/${d.invoice.id}`}
          className="font-mono text-xs hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {d.invoice.number}
        </Link>
      ),
    },
    {
      key: "customer",
      header: "Cliente",
      cell: (d) => d.invoice.customer.legalName,
    },
    {
      key: "driver",
      header: "Chofer",
      cell: (d) => (
        <div className="flex flex-col text-xs">
          <span>{d.driverName ?? "—"}</span>
          {d.vehiclePlate && <span className="text-muted-foreground">{d.vehiclePlate}</span>}
        </div>
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (d) => <StatusBadge status={d.status} />,
    },
  ];

  return (
    <DataTable
      data={deliveries}
      columns={columns}
      rowKey={(d) => d.id}
      searchPlaceholder="Buscar conduce..."
      onRowClick={(d) => router.push(`/facturacion/deliveries/${d.id}`)}
    />
  );
}
