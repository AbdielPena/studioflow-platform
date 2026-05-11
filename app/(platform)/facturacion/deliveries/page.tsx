import { Truck } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DeliveriesTable } from "@/modules/facturacion/components/deliveries-table";
import { listDeliveriesService } from "@/modules/facturacion/services/delivery.service";

export const metadata = { title: "Conduces" };

export default async function DeliveriesPage() {
  const ctx = await requireCompany();
  const deliveries = await listDeliveriesService(ctx.companyId);

  return (
    <div>
      <PageHeader
        title="Conduces / Entregas"
        description="Documentos logísticos. NO afectan inventario interno."
        breadcrumbs={[
          { label: "Facturación", href: "/facturacion" },
          { label: "Conduces" },
        ]}
      />
      <div className="p-6 lg:p-8">
        {deliveries.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Sin conduces"
            description="Los conduces se generan desde una factura confirmada."
          />
        ) : (
          <DeliveriesTable deliveries={deliveries} />
        )}
      </div>
    </div>
  );
}
