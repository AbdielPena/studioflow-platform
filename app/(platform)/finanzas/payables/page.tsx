import Link from "next/link";
import { Wallet, AlertTriangle } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/packages/lib/decimal";
import { listPayablesService } from "@/modules/finanzas/services/receivables.service";

export const metadata = { title: "Cuentas por pagar" };

export default async function PayablesPage() {
  const ctx = await requireCompany();
  const payables = await listPayablesService({ companyId: ctx.companyId });
  type Row = (typeof payables)[number];
  const now = new Date();

  const columns: Column<Row>[] = [
    {
      key: "purchase",
      header: "Compra",
      searchAccessor: (p) => `${p.purchase.number} ${p.supplier.legalName}`,
      cell: (p) => (
        <Link href={`/facturacion/purchases/${p.purchase.id}`} className="font-mono text-sm hover:underline">
          {p.purchase.number}
        </Link>
      ),
    },
    { key: "supplier", header: "Suplidor", cell: (p) => p.supplier.legalName },
    {
      key: "due",
      header: "Vence",
      cell: (p) => {
        if (!p.dueDate) return <span className="text-xs text-muted-foreground">—</span>;
        const overdue = p.dueDate < now && p.status !== "PAID";
        return (
          <div className="flex items-center gap-1">
            <span className="text-xs">{new Date(p.dueDate).toLocaleDateString("es-DO")}</span>
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
      cell: (p) => <span className="font-mono text-xs">{formatCurrency(p.total.toString())}</span>,
    },
    {
      key: "balance",
      header: "Por pagar",
      align: "right",
      cell: (p) => (
        <span className="font-mono font-medium text-warning">
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
    <div>
      <PageHeader
        title="Cuentas por pagar"
        description="Compras a crédito pendientes de pago."
        breadcrumbs={[{ label: "Finanzas", href: "/finanzas" }, { label: "CxP" }]}
      />
      <div className="p-6 lg:p-8">
        {payables.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Sin cuentas por pagar"
            description="Las CxP se generan automáticamente desde compras a crédito."
          />
        ) : (
          <DataTable
            data={payables}
            columns={columns}
            rowKey={(p) => p.id}
            searchPlaceholder="Buscar..."
          />
        )}
      </div>
    </div>
  );
}
