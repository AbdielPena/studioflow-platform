import { Banknote } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { prisma } from "@/packages/db";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/packages/lib/decimal";

export const metadata = { title: "Caja" };

export default async function CashPage() {
  const ctx = await requireCompany();
  const sessions = await prisma.cashSession.findMany({
    where: { cashRegister: { companyId: ctx.companyId } },
    include: { cashRegister: true, user: { select: { name: true, email: true } } },
    orderBy: { openedAt: "desc" },
    take: 50,
  });

  type Row = (typeof sessions)[number];

  const columns: Column<Row>[] = [
    {
      key: "register",
      header: "Caja",
      searchAccessor: (s) => `${s.cashRegister.name} ${s.user.email}`,
      cell: (s) => <span className="font-medium">{s.cashRegister.name}</span>,
    },
    {
      key: "user",
      header: "Cajero",
      cell: (s) => <span className="text-sm">{s.user.name ?? s.user.email}</span>,
    },
    {
      key: "opened",
      header: "Apertura",
      cell: (s) => (
        <span className="text-xs">
          {new Date(s.openedAt).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" })}
        </span>
      ),
    },
    {
      key: "openAmount",
      header: "Monto inicial",
      align: "right",
      cell: (s) => <span className="font-mono text-xs">{formatCurrency(s.openingAmount.toString())}</span>,
    },
    {
      key: "closeAmount",
      header: "Monto cierre",
      align: "right",
      cell: (s) => (
        <span className="font-mono text-xs">
          {s.closingAmount ? formatCurrency(s.closingAmount.toString()) : "—"}
        </span>
      ),
    },
    {
      key: "diff",
      header: "Diferencia",
      align: "right",
      cell: (s) =>
        s.difference ? (
          <span className={`font-mono text-xs ${Number(s.difference) !== 0 ? "text-warning" : ""}`}>
            {formatCurrency(s.difference.toString())}
          </span>
        ) : (
          "—"
        ),
    },
    { key: "status", header: "Estado", cell: (s) => <StatusBadge status={s.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Caja"
        description="Apertura, cierre y arqueo de cajas registradoras."
        breadcrumbs={[{ label: "Finanzas", href: "/finanzas" }, { label: "Caja" }]}
      />
      <div className="p-6 lg:p-8">
        {sessions.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="Sin sesiones de caja"
            description="Las sesiones se crean automáticamente al abrir caja desde el POS."
          />
        ) : (
          <DataTable
            data={sessions}
            columns={columns}
            rowKey={(s) => s.id}
            searchPlaceholder="Buscar..."
          />
        )}
      </div>
    </div>
  );
}
