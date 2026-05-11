import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { Boxes } from "lucide-react";

export const metadata = { title: "Inventario Externo" };

export default function InventarioLinkPage() {
  return (
    <ModulePlaceholder
      icon={Boxes}
      title="Conexión con Inventario Externo"
      description="Esta plataforma NO mantiene inventario interno. Se conecta a tu software de inventario existente."
      phase="Fase 3"
      features={[
        "Configurar URL/API, token, headers personalizados",
        "Sincronización de productos local ↔ externo",
        "Consulta de stock en tiempo real",
        "Reserva al crear factura, descuento al confirmar",
        "Liberación automática al anular",
        "Cola de jobs pendientes + reintentos",
        "Logs detallados de cada operación",
        "Modo manual si falla la conexión",
      ]}
    />
  );
}
