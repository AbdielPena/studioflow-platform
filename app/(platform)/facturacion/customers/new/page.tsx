import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerForm } from "@/modules/customers/components/customer-form";

export const metadata = { title: "Nuevo cliente" };

export default async function NewCustomerPage() {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.FACTURACION_CUSTOMER_MANAGE);

  return (
    <div>
      <PageHeader
        title="Nuevo cliente"
        breadcrumbs={[
          { label: "Facturación", href: "/facturacion" },
          { label: "Clientes", href: "/facturacion/customers" },
          { label: "Nuevo" },
        ]}
      />
      <div className="mx-auto max-w-4xl p-6 lg:p-8">
        <CustomerForm mode="create" />
      </div>
    </div>
  );
}
