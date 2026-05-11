import { requireCompany } from "@/packages/auth/session";
import { prisma } from "@/packages/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@/packages/lib/decimal";

export const metadata = { title: "Reportes" };

export default async function ReportsPage() {
  const ctx = await requireCompany();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [salesToday, salesMonth, salesYear, taxes, invoicesByStatus] = await Promise.all([
    prisma.invoice.aggregate({
      where: {
        companyId: ctx.companyId,
        deletedAt: null,
        status: { not: "VOIDED" },
        issueDate: { gte: startOfDay },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: {
        companyId: ctx.companyId,
        deletedAt: null,
        status: { not: "VOIDED" },
        issueDate: { gte: startOfMonth },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: {
        companyId: ctx.companyId,
        deletedAt: null,
        status: { not: "VOIDED" },
        issueDate: { gte: startOfYear },
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: {
        companyId: ctx.companyId,
        deletedAt: null,
        status: { not: "VOIDED" },
        issueDate: { gte: startOfMonth },
      },
      _sum: { taxTotal: true },
    }),
    prisma.invoice.groupBy({
      by: ["status"],
      where: { companyId: ctx.companyId, deletedAt: null },
      _count: true,
    }),
  ]);

  const stats = [
    { label: "Ventas hoy", value: salesToday._sum.total?.toString() ?? "0", count: salesToday._count },
    { label: "Ventas del mes", value: salesMonth._sum.total?.toString() ?? "0", count: salesMonth._count },
    { label: "Ventas del año", value: salesYear._sum.total?.toString() ?? "0", count: salesYear._count },
    { label: "ITBIS del mes", value: taxes._sum.taxTotal?.toString() ?? "0", count: salesMonth._count },
  ];

  return (
    <div>
      <PageHeader
        title="Reportes financieros"
        description="Resumen de ventas, impuestos y estado de facturación."
        breadcrumbs={[{ label: "Finanzas", href: "/finanzas" }, { label: "Reportes" }]}
      />
      <div className="space-y-6 p-6 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardHeader>
                <CardDescription className="text-xs uppercase tracking-wider">{s.label}</CardDescription>
                <CardTitle className="text-2xl font-semibold">{formatCurrency(s.value)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{s.count} facturas</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por estado</CardTitle>
            <CardDescription>Todas las facturas históricas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {invoicesByStatus.map((s) => (
                <div key={s.status} className="rounded-xl border bg-card/30 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.status}</p>
                  <p className="mt-1 text-2xl font-semibold">{s._count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
