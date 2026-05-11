import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { ShoppingCart } from "lucide-react";

export const metadata = { title: "POS" };

export default function PosPage() {
  return (
    <ModulePlaceholder
      icon={ShoppingCart}
      title="Punto de Venta"
      description="Interfaz táctil con búsqueda por código de barras, multi-pago, apertura/cierre de caja."
      phase="Fase 4"
      features={[
        "Búsqueda por nombre, SKU o código de barras",
        "Categorías rápidas + carrito",
        "Múltiples métodos de pago en una sola venta",
        "Apertura, cierre y arqueo de caja",
        "Impresión térmica + factura fiscal",
        "Consulta de stock en inventario externo",
        "Ventas pendientes de sincronización",
      ]}
    />
  );
}
