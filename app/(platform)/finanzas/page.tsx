import Link from "next/link";
import { ArrowRight, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/packages/lib/decimal";
import { getFinanceSummary } from "@/modules/finanzas/services/receivables.service";

export const metadata = { title: "Finanzas" };

export default async function FinanzasPage() {
  const ctx = await requireCompany();
  const summary = await getFinanceSummary(ctx.companyId);

  const sections = [
    {
      title: "Cuentas por cobrar",
      description: `${summary.receivable.count} facturas pendientes`,
      total: summary.receivable.total,
      overdue: summary.receivable.overdue,
      icon: TrendingUp,
      tone: "text-success bg-success/10",
      href: "/finanzas/receivables",
    },
    {
      title: "Cuentas por pagar",
      description: `${summary.payable.count} compras pendientes`,
      total: summary.payable.total,
      overdue: summary.payable.overdue,
      icon: TrendingDown,
      tone: "text-warning bg-warning/10",
      href: "/finanzas/payables",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Finanzas"
        description="CxC, CxP, caja, bancos y reportes financieros."
        breadcrumbs={[{ label: "Finanzas" }]}
      />
      <div className="space-y-6 p-6 lg:p-8">
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.href} href={s.href} className="group">
                <Card className="transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.tone}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                    <CardTitle className="mt-3">{s.title}</CardTitle>
                    <CardDescription>{s.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-semibold">{formatCurrency(s.total)}</p>
                    {s.overdue > 0 && (
                      <Badge variant="destructive" className="mt-2 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        {s.overdue} vencidas
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/finanzas/banks">
            <Card className="transition-colors hover:bg-accent/30">
              <CardHeader>
                <CardTitle className="text-base">Bancos y carteras</CardTitle>
                <CardDescription>Cuentas bancarias y digitales</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/finanzas/cash">
            <Card className="transition-colors hover:bg-accent/30">
              <CardHeader>
                <CardTitle className="text-base">Caja</CardTitle>
                <CardDescription>Apertura, cierre y arqueo</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/finanzas/reportes">
            <Card className="transition-colors hover:bg-accent/30">
              <CardHeader>
                <CardTitle className="text-base">Reportes</CardTitle>
                <CardDescription>Ventas, impuestos, flujo</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
