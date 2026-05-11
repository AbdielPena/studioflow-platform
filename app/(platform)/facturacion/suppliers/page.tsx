import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { listSuppliersService } from "@/modules/suppliers/services/supplier.service";
import { SuppliersTable } from "@/modules/suppliers/components/suppliers-table";

export const metadata = { title: "Suplidores" };

export default async function SuppliersListPage() {
  const ctx = await requireCompany();
  const suppliers = await listSuppliersService(ctx.companyId);

  return (
    <div>
      <PageHeader
        title="Suplidores"
        description="Gestión de proveedores para compras y cuentas por pagar."
        breadcrumbs={[
          { label: "Facturación", href: "/facturacion" },
          { label: "Suplidores" },
        ]}
        actions={
          <Button asChild>
            <Link href="/facturacion/suppliers/new">
              <Plus className="h-4 w-4" />
              Nuevo suplidor
            </Link>
          </Button>
        }
      />
      <div className="p-6 lg:p-8">
        {suppliers.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Sin suplidores"
            description="Registra tus proveedores para empezar a llevar compras y cuentas por pagar."
            actionLabel="Nuevo suplidor"
            actionHref="/facturacion/suppliers/new"
          />
        ) : (
          <SuppliersTable suppliers={suppliers} />
        )}
      </div>
    </div>
  );
}
