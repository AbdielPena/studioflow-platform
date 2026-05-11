import Link from "next/link";
import { Wallet, AlertTriangle } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/packages/lib/decimal";
import { listReceivablesService } from "@/modules/finanzas/services/receivables.service";

export const metadata = { title: "Cuentas por cobrar" };

export default async function ReceivablesPage() {
  const ctx = await requireCompany();
  const receivables = await listReceivablesService({ companyId: ctx.companyId });
  type Row = (typeof receivables)[number];
  const now = new Date();

  const columns: Column<Row>[] = [
    {
      key: "invoice",
      header: "Factura",
      searchAccessor: (r) => `${r.invoice.number} ${r.customer.legalName}`,
      cell: (r) => (
        <Link
          href={`/facturacion/invoices/${r.invoice.id}`}
          className="font-mono text-sm font-medium hover:underline"
        >
          {r.invoice.number}
        </Link>
      ),
    },
    { key: "customer", header: "Cliente", cell: (r) => r.customer.legalName },
    {
      key: "due",
      header: "Vence",
      cell: (r) => {
        if (!r.dueDate) return <span className="text-xs text-muted-foreground">—</span>;
        const overdue = r.dueDate < now && r.status !== "PAID";
        return (
          <div className="flex items-center gap-1">
            <span className="text-xs">{new Date(r.dueDate).toLocaleDateString("es-DO")}</span>
            {overdue && (
              <Badge variant="destructive" className="text-[10px]">
                <AlertTriangle className="h-3 w-3" />
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      cell: (r) => <span className="font-mono text-xs">{formatCurrency(r.total.toString())}</span>,
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      cell: (r) => (
        <span className="font-mono font-medium text-warning">
          {formatCurrency(r.balanceDue.toString())}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (r) => <StatusBadge status={r.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Cuentas por cobrar"
        description="Facturas a crédito pendientes de cobro."
        breadcrumbs={[{ label: "Finanzas", href: "/finanzas" }, { label: "CxC" }]}
      />
      <div className="p-6 lg:p-8">
        {receivables.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Sin cuentas por cobrar"
            description="Las CxC se generan automáticamente desde facturas a crédito."
          />
        ) : (
          <DataTable
            data={receivables}
            columns={columns}
            rowKey={(r) => r.id}
            searchPlaceholder="Buscar..."
          />
        )}
      </div>
    </div>
  );
}
