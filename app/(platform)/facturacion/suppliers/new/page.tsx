import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { SupplierForm } from "@/modules/suppliers/components/supplier-form";

export const metadata = { title: "Nuevo suplidor" };

export default async function NewSupplierPage() {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.SUPPLIER_MANAGE);
  return (
    <div>
      <PageHeader
        title="Nuevo suplidor"
        breadcrumbs={[
          { label: "Facturación", href: "/facturacion" },
          { label: "Suplidores", href: "/facturacion/suppliers" },
          { label: "Nuevo" },
        ]}
      />
      <div className="mx-auto max-w-4xl p-6 lg:p-8">
        <SupplierForm mode="create" />
      </div>
    </div>
  );
}
