import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { listProductsService } from "@/modules/products/services/product.service";
import { ProductsTable } from "@/modules/products/components/products-table";

export const metadata = { title: "Productos" };

export default async function ProductsListPage() {
  const ctx = await requireCompany();
  const products = await listProductsService(ctx.companyId);

  return (
    <div>
      <PageHeader
        title="Productos y servicios"
        description="Catálogo local. El stock real vive en tu sistema externo de inventario."
        breadcrumbs={[
          { label: "Facturación", href: "/facturacion" },
          { label: "Productos" },
        ]}
        actions={
          <Button asChild>
            <Link href="/facturacion/products/new">
              <Plus className="h-4 w-4" />
              Nuevo producto
            </Link>
          </Button>
        }
      />
      <div className="p-6 lg:p-8">
        {products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Sin productos todavía"
            description="Crea productos o servicios para incluirlos en cotizaciones y facturas."
            actionLabel="Crear producto"
            actionHref="/facturacion/products/new"
          />
        ) : (
          <ProductsTable products={products} />
        )}
      </div>
    </div>
  );
}
