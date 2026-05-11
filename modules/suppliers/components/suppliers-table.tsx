"use client";

import { useRouter } from "next/navigation";
import { formatCurrency } from "@/packages/lib/decimal";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Supplier } from "@prisma/client";

export function SuppliersTable({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter();

  const columns: Column<Supplier>[] = [
    {
      key: "name",
      header: "Suplidor",
      searchAccessor: (s) => `${s.legalName} ${s.tradeName ?? ""} ${s.documentNumber ?? ""}`,
      cell: (s) => (
        <div className="flex flex-col">
          <span className="font-medium">{s.legalName}</span>
          {s.tradeName && <span className="text-xs text-muted-foreground">{s.tradeName}</span>}
        </div>
      ),
    },
    {
      key: "doc",
      header: "RNC",
      cell: (s) => <span className="font-mono text-xs">{s.documentNumber ?? "—"}</span>,
    },
    {
      key: "contact",
      header: "Contacto",
      cell: (s) => (
        <div className="flex flex-col text-xs">
          <span>{s.email ?? "—"}</span>
          <span className="text-muted-foreground">{s.phone ?? ""}</span>
        </div>
      ),
    },
    {
      key: "terms",
      header: "Plazo",
      align: "center",
      cell: (s) => (
        <span className="text-xs">
          {s.paymentTerms === 0 ? "Contado" : `${s.paymentTerms} días`}
        </span>
      ),
    },
    {
      key: "balanceDue",
      header: "Por pagar",
      align: "right",
      cell: (s) => (
        <span className={s.balanceDue.toString() !== "0" ? "font-medium text-warning" : "text-muted-foreground"}>
          {formatCurrency(s.balanceDue.toString())}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (s) => <StatusBadge status={s.status} />,
    },
  ];

  return (
    <DataTable
      data={suppliers}
      columns={columns}
      rowKey={(s) => s.id}
      searchPlaceholder="Buscar suplidor..."
      emptyMessage="No hay suplidores registrados."
      onRowClick={(s) => router.push(`/facturacion/suppliers/${s.id}`)}
    />
  );
}
