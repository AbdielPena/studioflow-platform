import { Banknote } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { prisma } from "@/packages/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/packages/lib/decimal";
import {
  OpenCashSessionDialog,
  CloseCashSessionDialog,
  CreateCashRegisterDialog,
} from "@/modules/finanzas/components/cash-session-dialog";

export const metadata = { title: "Caja" };

export default async function CashPage() {
  const ctx = await requireCompany();

  const [registers, sessions] = await Promise.all([
    prisma.cashRegister.findMany({
      where: { companyId: ctx.companyId, deletedAt: null },
      include: {
        sessions: {
          where: { status: "OPEN" },
          orderBy: { openedAt: "desc" },
          take: 1,
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.cashSession.findMany({
      where: { cashRegister: { companyId: ctx.companyId } },
      include: { cashRegister: true, user: { select: { name: true, email: true } } },
      orderBy: { openedAt: "desc" },
      take: 50,
    }),
  ]);

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
      header: "Inicial",
      align: "right",
      cell: (s) => (
        <span className="font-mono text-xs">{formatCurrency(s.openingAmount.toString())}</span>
      ),
    },
    {
      key: "closeAmount",
      header: "Cierre",
      align: "right",
      cell: (s) => (
        <span className="font-mono text-xs">
          {s.closingAmount ? formatCurrency(s.closingAmount.toString()) : "—"}
        </span>
      ),
    },
    {
      key: "diff",
      header: "Dif.",
      align: "right",
      cell: (s) =>
        s.difference ? (
          <span
            className={`font-mono text-xs ${Number(s.difference) !== 0 ? "font-medium text-warning" : ""}`}
          >
            {formatCurrency(s.difference.toString())}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    { key: "status", header: "Estado", cell: (s) => <StatusBadge status={s.status} /> },
  ];

  const registersForDialog = registers.map((r) => ({
    id: r.id,
    name: r.name,
    hasOpenSession: r.sessions.length > 0,
  }));

  const openSessionsMap = new Map(
    registers
      .filter((r) => r.sessions[0])
      .map((r) => [r.id, r.sessions[0]] as const),
  );

  return (
    <div>
      <PageHeader
        title="Caja"
        description="Apertura, cierre y arqueo de cajas registradoras."
        breadcrumbs={[{ label: "Finanzas", href: "/finanzas" }, { label: "Caja" }]}
        actions={
          <div className="flex items-center gap-2">
            <CreateCashRegisterDialog />
            <OpenCashSessionDialog registers={registersForDialog} />
          </div>
        }
      />

      <div className="space-y-6 p-6 lg:p-8">
        {registers.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="Sin cajas registradoras"
            description="Crea una caja registradora para empezar a operar el POS."
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Cajas configuradas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {registers.map((r) => {
                const active = openSessionsMap.get(r.id);
                return (
                  <div key={r.id} className="rounded-2xl border bg-card/50 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{r.name}</p>
                        {active ? (
                          <Badge variant="success" className="mt-1">
                            Abierta desde{" "}
                            {new Date(active.openedAt).toLocaleTimeString("es-DO", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="mt-1">
                            Cerrada
                          </Badge>
                        )}
                      </div>
                      <Banknote className="h-5 w-5 text-muted-foreground" />
                    </div>
                    {active && (
                      <div className="mt-3 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cajero</span>
                          <span>{active.user.name ?? active.user.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Inicial</span>
                          <span className="font-mono">
                            {formatCurrency(active.openingAmount.toString())}
                          </span>
                        </div>
                        <CloseCashSessionDialog sessionId={active.id} />
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {sessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Historial de sesiones</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={sessions}
                columns={columns}
                rowKey={(s) => s.id}
                searchPlaceholder="Buscar..."
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
