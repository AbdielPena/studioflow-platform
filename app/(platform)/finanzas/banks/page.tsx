import { Building, Plus } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { prisma } from "@/packages/db";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/packages/lib/decimal";
import type { BankAccount } from "@prisma/client";

export const metadata = { title: "Bancos" };

export default async function BanksPage() {
  const ctx = await requireCompany();
  const accounts = await prisma.bankAccount.findMany({
    where: { companyId: ctx.companyId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  const columns: Column<BankAccount>[] = [
    { key: "name", header: "Nombre", searchAccessor: (a) => a.name, cell: (a) => <span className="font-medium">{a.name}</span> },
    { key: "bank", header: "Banco", cell: (a) => a.bankName ?? "—" },
    { key: "type", header: "Tipo", cell: (a) => <span className="text-xs">{a.accountType ?? "—"}</span> },
    { key: "currency", header: "Moneda", cell: (a) => <span className="font-mono text-xs">{a.currency}</span> },
    { key: "balance", header: "Balance", align: "right", cell: (a) => <span className="font-mono font-medium">{formatCurrency(a.balance.toString())}</span> },
    { key: "status", header: "Estado", cell: (a) => <StatusBadge status={a.isActive ? "ACTIVE" : "INACTIVE"} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Bancos y carteras"
        description="Cuentas bancarias y wallets digitales."
        breadcrumbs={[{ label: "Finanzas", href: "/finanzas" }, { label: "Bancos" }]}
        actions={
          <Button disabled>
            <Plus className="h-4 w-4" />
            Nueva cuenta (próximamente)
          </Button>
        }
      />
      <div className="p-6 lg:p-8">
        {accounts.length === 0 ? (
          <EmptyState
            icon={Building}
            title="Sin cuentas bancarias"
            description="Las cuentas bancarias permiten registrar pagos por transferencia y carteras digitales."
          />
        ) : (
          <DataTable
            data={accounts}
            columns={columns}
            rowKey={(a) => a.id}
            searchPlaceholder="Buscar cuenta..."
          />
        )}
      </div>
    </div>
  );
}
