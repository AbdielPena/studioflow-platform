import Link from "next/link";
import { Plus, ShoppingBag } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PurchasesTable } from "@/modules/purchases/components/purchases-table";
import { listPurchasesService } from "@/modules/purchases/services/purchase.service";

export const metadata = { title: "Compras" };

export default async function PurchasesPage() {
  const ctx = await requireCompany();
  const purchases = await listPurchasesService(ctx.companyId);

  return (
    <div>
      <PageHeader
        title="Compras"
        description="Compras a suplidores. NO alimentan inventario interno."
        breadcrumbs={[
          { label: "Facturación", href: "/facturacion" },
          { label: "Compras" },
        ]}
        actions={
          <Button asChild>
            <Link href="/facturacion/purchases/new">
              <Plus className="h-4 w-4" />
              Nueva compra
            </Link>
          </Button>
        }
      />
      <div className="p-6 lg:p-8">
        {purchases.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Sin compras"
            description="Registra tu primera compra para empezar a llevar CxP."
            actionLabel="Nueva compra"
            actionHref="/facturacion/purchases/new"
          />
        ) : (
          <PurchasesTable purchases={purchases} />
        )}
      </div>
    </div>
  );
}
