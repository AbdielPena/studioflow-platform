import {
  Receipt,
  FileText,
  Wallet,
  TrendingUp,
  AlertCircle,
  Boxes,
  Users,
  Camera,
} from "lucide-react";
import { requireSession } from "@/packages/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/packages/lib/decimal";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ctx = await requireSession();

  // Placeholder data — Fase 1 reemplaza con repositories reales
  const stats = [
    { label: "Ventas hoy", value: formatCurrency(0), icon: Receipt, hint: "0 facturas", color: "primary" },
    { label: "Ventas mes", value: formatCurrency(0), icon: TrendingUp, hint: "vs mes anterior", color: "success" },
    { label: "Cotizaciones abiertas", value: "0", icon: FileText, hint: "0 vencidas", color: "info" },
    { label: "CxC vencidas", value: formatCurrency(0), icon: Wallet, hint: "0 facturas", color: "warning" },
  ] as const;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Hola, {ctx.email} · <span className="capitalize">{ctx.systemRole.toLowerCase()}</span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dashboard ejecutivo</h1>
        </div>
        <Badge variant="info">Fase 0 · Foundation</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardDescription className="text-xs uppercase tracking-wider">
                  {s.label}
                </CardDescription>
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
            <CardTitle>Tendencia de ventas</CardTitle>
            <CardDescription>Últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed bg-muted/30 text-sm text-muted-foreground">
              Charts animados — Fase 1 (Recharts)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              Alertas inteligentes
            </CardTitle>
            <CardDescription>Sin alertas activas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <AlertItem icon={Boxes} title="Inventario externo desconectado" tone="warning" />
            <AlertItem icon={Receipt} title="NCF B02 al 80% del rango" tone="info" />
            <AlertItem icon={Users} title="3 cotizaciones a punto de vencer" tone="info" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ModuleCard icon={Receipt} title="Facturación" desc="Cotizaciones, facturas, NCF" href="/facturacion" />
        <ModuleCard icon={Users} title="CRM" desc="Leads, proyectos, clientes" href="/crm" />
        <ModuleCard icon={Camera} title="Galerías" desc="Pixieset-like, fotógrafos" href="/gallery" />
        <ModuleCard icon={Wallet} title="Finanzas" desc="CxC, CxP, caja, bancos" href="/finanzas" />
      </div>
    </div>
  );
}

function AlertItem({
  icon: Icon,
  title,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tone: "warning" | "info" | "success" | "destructive";
}) {
  const toneClass = {
    warning: "text-warning bg-warning/10",
    info: "text-info bg-info/10",
    success: "text-success bg-success/10",
    destructive: "text-destructive bg-destructive/10",
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card/50 p-2.5">
      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="flex-1 text-xs">{title}</span>
    </div>
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
    <a
      href={href}
      className="group rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
    </a>
  );
}
