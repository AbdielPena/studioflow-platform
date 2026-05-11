import Link from "next/link";
import {
  Receipt,
  FileText,
  Wallet,
  TrendingUp,
  AlertCircle,
  Boxes,
  Users,
  Camera,
  Package,
  ShoppingBag,
} from "lucide-react";
import { requireSession } from "@/packages/auth/session";
import { prisma } from "@/packages/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/packages/lib/decimal";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ctx = await requireSession();

  if (!ctx.companyId) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Selecciona una empresa</CardTitle>
            <CardDescription>
              No tienes una empresa activa asignada. Contacta a tu administrador.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    salesToday,
    salesMonth,
    openQuotes,
    overdueReceivables,
    syncPending,
    activeConn,
    counts,
  ] = await Promise.all([
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
    prisma.quote.count({
      where: {
        companyId: ctx.companyId,
        deletedAt: null,
        status: { in: ["DRAFT", "SENT", "APPROVED"] },
      },
    }),
    prisma.accountReceivable.aggregate({
      where: {
        companyId: ctx.companyId,
        deletedAt: null,
        status: { in: ["OPEN", "PARTIALLY_PAID"] },
        dueDate: { lt: now },
      },
      _sum: { balanceDue: true },
      _count: true,
    }),
    prisma.pendingInventorySyncJob.count({
      where: {
        companyId: ctx.companyId,
        status: { in: ["QUEUED", "RETRYING", "FAILED", "DEAD_LETTER"] },
      },
    }),
    prisma.externalInventoryConnection.findFirst({
      where: { companyId: ctx.companyId, deletedAt: null, isActive: true },
    }),
    prisma.$transaction([
      prisma.customer.count({ where: { companyId: ctx.companyId, deletedAt: null } }),
      prisma.product.count({ where: { companyId: ctx.companyId, deletedAt: null } }),
      prisma.supplier.count({ where: { companyId: ctx.companyId, deletedAt: null } }),
      prisma.invoice.count({ where: { companyId: ctx.companyId, deletedAt: null } }),
    ]),
  ]);

  const stats = [
    {
      label: "Ventas hoy",
      value: formatCurrency(salesToday._sum.total?.toString() ?? "0"),
      icon: Receipt,
      hint: `${salesToday._count} facturas`,
    },
    {
      label: "Ventas del mes",
      value: formatCurrency(salesMonth._sum.total?.toString() ?? "0"),
      icon: TrendingUp,
      hint: `${salesMonth._count} facturas`,
    },
    {
      label: "Cotizaciones abiertas",
      value: openQuotes.toString(),
      icon: FileText,
      hint: "Pendientes de conversión",
    },
    {
      label: "CxC vencidas",
      value: formatCurrency(overdueReceivables._sum.balanceDue?.toString() ?? "0"),
      icon: Wallet,
      hint: `${overdueReceivables._count} facturas`,
    },
  ];

  const alerts: Array<{ icon: typeof Boxes; title: string; tone: "warning" | "destructive" | "info" }> = [];
  if (!activeConn) {
    alerts.push({
      icon: Boxes,
      title: "Sin conexión de inventario externo configurada",
      tone: "info",
    });
  } else if (activeConn.lastHealthOk === false) {
    alerts.push({
      icon: Boxes,
      title: `Conexión "${activeConn.name}" falló su último health check`,
      tone: "destructive",
    });
  }
  if (syncPending > 0) {
    alerts.push({
      icon: AlertCircle,
      title: `${syncPending} jobs de inventario pendientes`,
      tone: "warning",
    });
  }
  if (overdueReceivables._count > 0) {
    alerts.push({
      icon: AlertCircle,
      title: `${overdueReceivables._count} facturas vencidas sin cobrar`,
      tone: "warning",
    });
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Hola, {ctx.email} ·{" "}
            <span className="capitalize">{ctx.systemRole.toLowerCase()}</span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dashboard ejecutivo</h1>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardDescription className="text-xs uppercase tracking-wider">{s.label}</CardDescription>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resumen del catálogo</CardTitle>
            <CardDescription>Datos a tu disposición</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile icon={Users} label="Clientes" value={counts[0]} href="/facturacion/customers" />
              <StatTile icon={Package} label="Productos" value={counts[1]} href="/facturacion/products" />
              <StatTile icon={ShoppingBag} label="Suplidores" value={counts[2]} href="/facturacion/suppliers" />
              <StatTile icon={Receipt} label="Facturas" value={counts[3]} href="/facturacion" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              Alertas inteligentes
            </CardTitle>
            {alerts.length === 0 && <CardDescription>Sin alertas activas ✓</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {alerts.length === 0 ? (
              <p className="text-xs text-muted-foreground">Todo en orden.</p>
            ) : (
              alerts.map((a, i) => {
                const Icon = a.icon;
                const toneClass = {
                  warning: "text-warning bg-warning/10",
                  info: "text-info bg-info/10",
                  destructive: "text-destructive bg-destructive/10",
                }[a.tone];
                return (
                  <div key={i} className="flex items-center gap-3 rounded-xl border bg-card/50 p-2.5">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${toneClass}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="flex-1 text-xs">{a.title}</span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ModuleCard icon={Receipt} title="Facturación" desc="Crear factura nueva" href="/facturacion/invoices/new" />
        <ModuleCard icon={FileText} title="Cotizaciones" desc="Nueva cotización" href="/facturacion/quotes/new" />
        <ModuleCard icon={Boxes} title="Inventario" desc="Configurar conexión" href="/inventario-link" />
        <ModuleCard icon={Wallet} title="Finanzas" desc="CxC, CxP, caja" href="/finanzas" />
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border bg-card/40 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-sm"
    >
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Link>
  );
}

function ModuleCard({
  icon: Icon,
  title,
  desc,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
    </Link>
  );
}
