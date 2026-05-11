import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { Receipt } from "lucide-react";

export const metadata = { title: "Facturación" };

export default function FacturacionPage() {
  return (
    <ModulePlaceholder
      icon={Receipt}
      title="Facturación"
      description="Cotizaciones, facturas fiscales (NCF B0X), notas de crédito/débito, conduces, POS, CxC."
      phase="Fase 2"
      features={[
        "Cotizaciones con conversión a factura",
        "Facturas fiscales con NCF dominicano",
        "ITBIS 18/16/0, retenciones, propina legal",
        "Pagos parciales y mixtos",
        "Conduce logístico (snapshot, no toca inventario)",
        "Validación de stock vía inventario externo",
        "PDF profesional + envío por correo",
      ]}
    />
  );
}
