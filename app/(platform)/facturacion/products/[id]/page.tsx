import { notFound } from "next/navigation";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ProductForm } from "@/modules/products/components/product-form";
import {
  getProductService,
  listCategoriesService,
} from "@/modules/products/services/product.service";
import { isAppError } from "@/packages/lib/errors";

export const metadata = { title: "Editar producto" };

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.FACTURACION_PRODUCT_MANAGE);

  let product;
  try {
    product = await getProductService(ctx.companyId, params.id);
  } catch (err) {
    if (isAppError(err) && err.code === "NOT_FOUND") notFound();
    throw err;
  }
  const categories = await listCategoriesService(ctx.companyId);

  return (
    <div>
      <PageHeader
        title={product.name}
        description={product.sku}
        breadcrumbs={[
          { label: "Facturación", href: "/facturacion" },
          { label: "Productos", href: "/facturacion/products" },
          { label: product.name },
        ]}
      />
      <div className="mx-auto max-w-4xl p-6 lg:p-8">
        <ProductForm
          mode="edit"
          id={product.id}
          categories={categories}
          defaultValues={{
            type: product.type,
            sku: product.sku,
            barcode: product.barcode,
            name: product.name,
            description: product.description,
            unit: product.unit,
            price: Number(product.price),
            costReference: product.costReference ? Number(product.costReference) : null,
            taxConfigKey: product.taxConfigKey,
            categoryId: product.categoryId,
            imageUrl: product.imageUrl,
            externalId: product.externalId,
            isActive: product.isActive,
          }}
        />
      </div>
    </div>
  );
}
