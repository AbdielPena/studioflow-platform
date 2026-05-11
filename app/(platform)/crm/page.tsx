import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { Users } from "lucide-react";

export const metadata = { title: "CRM" };

export default function CrmPage() {
  return (
    <ModulePlaceholder
      icon={Users}
      title="CRM"
      description="Leads, deals, proyectos y comunicación con clientes. Migración desde StudioFlow."
      phase="Migración pendiente"
      features={[
        "Pipeline de leads (Nuevo → Contactado → Ganado)",
        "Proyectos fotográficos / sesiones",
        "Historial de comunicación",
        "Notas y etiquetas por cliente",
        "Integración con cotizaciones y facturación",
      ]}
    />
  );
}
