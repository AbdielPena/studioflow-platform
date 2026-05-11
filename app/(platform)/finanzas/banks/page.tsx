import { Building } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { prisma } from "@/packages/db";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/packages/lib/decimal";
import { NewBankAccountDialog } from "@/modules/finanzas/components/bank-account-dialog";
import type { BankAccount } from "@prisma/client";

export const metadata = { title: "Bancos" };

const TYPE_LABEL: Record<string, string> = {
  CHECKING: "Corriente",
  SAVINGS: "Ahorros",
  WALLET: "Wallet",
};

export default async function BanksPage() {
  const ctx = await requireCompany();
  const accounts = await prisma.bankAccount.findMany({
    where: { companyId: ctx.companyId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  const columns: Column<BankAccount>[] = [
    {
      key: "name",
      header: "Cuenta",
      searchAccessor: (a) => `${a.name} ${a.bankName ?? ""} ${a.accountNumber ?? ""}`,
      cell: (a) => (
        <div className="flex flex-col">
          <span className="font-medium">{a.name}</span>
          {a.bankName && <span className="text-xs text-muted-foreground">{a.bankName}</span>}
        </div>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      cell: (a) => <span className="text-xs">{a.accountType ? TYPE_LABEL[a.accountType] : "—"}</span>,
    },
    {
      key: "number",
      header: "Número",
      cell: (a) => (
        <span className="font-mono text-xs text-muted-foreground">
          {a.accountNumber ?? "—"}
        </span>
      ),
    },
    {
      key: "currency",
      header: "Moneda",
      cell: (a) => <span className="font-mono text-xs">{a.currency}</span>,
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      cell: (a) => (
        <span className="font-mono font-medium">{formatCurrency(a.balance.toString())}</span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (a) => <StatusBadge status={a.isActive ? "ACTIVE" : "INACTIVE"} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Bancos y carteras"
        description="Cuentas bancarias y wallets digitales para registro de pagos."
        breadcrumbs={[{ label: "Finanzas", href: "/finanzas" }, { label: "Bancos" }]}
        actions={<NewBankAccountDialog />}
      />
      <div className="p-6 lg:p-8">
        {accounts.length === 0 ? (
          <EmptyState
            icon={Building}
            title="Sin cuentas bancarias"
            description="Registra una cuenta para empezar a recibir y emitir pagos."
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
