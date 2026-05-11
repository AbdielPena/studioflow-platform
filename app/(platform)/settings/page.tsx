import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { Settings } from "lucide-react";

export const metadata = { title: "Configuración" };

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      icon={Settings}
      title="Configuración"
      description="Empresas, sucursales, usuarios, roles, NCF, impuestos, integración inventario, plantillas PDF."
      phase="Fase 1"
      features={[
        "Datos fiscales por empresa",
        "Multi-sucursal",
        "Usuarios y roles granulares",
        "Secuencias NCF (B01–B17)",
        "Impuestos custom (ITBIS, retenciones)",
        "Configuración inventario externo",
        "Plantillas PDF",
      ]}
    />
  );
}
