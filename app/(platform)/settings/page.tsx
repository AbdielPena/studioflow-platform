import Link from "next/link";
import { Building2, MapPin, Receipt, Percent, Users, Plug } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Configuración" };

const SETTINGS_SECTIONS = [
  {
    icon: Building2,
    title: "Empresa",
    description: "Razón social, RNC, datos de contacto, moneda y zona horaria.",
    href: "/settings/company",
  },
  {
    icon: MapPin,
    title: "Sucursales",
    description: "Administra sucursales y la principal.",
    href: "/settings/branches",
  },
  {
    icon: Receipt,
    title: "NCF",
    description: "Secuencias de comprobantes fiscales (B01–B17).",
    href: "/settings/ncf",
  },
  {
    icon: Percent,
    title: "Impuestos",
    description: "ITBIS, retenciones y configuraciones fiscales custom.",
    href: "/settings/taxes",
  },
  {
    icon: Users,
    title: "Usuarios y roles",
    description: "Miembros de la empresa, roles y permisos.",
    href: "/settings/users",
  },
  {
    icon: Plug,
    title: "Inventario externo",
    description: "Conexión con tu sistema de inventario aparte.",
    href: "/inventario-link",
  },
];

export default async function SettingsPage() {
  await requireCompany();
  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Administra los aspectos centrales de tu plataforma."
        breadcrumbs={[{ label: "Configuración" }]}
      />
      <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 lg:p-8">
        {SETTINGS_SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href}>
              <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{s.title}</CardTitle>
                  <CardDescription>{s.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
