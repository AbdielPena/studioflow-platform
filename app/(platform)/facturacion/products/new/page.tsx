import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ProductForm } from "@/modules/products/components/product-form";
import { listCategoriesService } from "@/modules/products/services/product.service";

export const metadata = { title: "Nuevo producto" };

export default async function NewProductPage() {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.FACTURACION_PRODUCT_MANAGE);
  const categories = await listCategoriesService(ctx.companyId);

  return (
    <div>
      <PageHeader
        title="Nuevo producto"
        breadcrumbs={[
          { label: "Facturación", href: "/facturacion" },
          { label: "Productos", href: "/facturacion/products" },
          { label: "Nuevo" },
        ]}
      />
      <div className="mx-auto max-w-4xl p-6 lg:p-8">
        <ProductForm mode="create" categories={categories} />
      </div>
    </div>
  );
}
