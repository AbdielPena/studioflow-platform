import { notFound } from "next/navigation";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerForm } from "@/modules/customers/components/customer-form";
import { getCustomerService } from "@/modules/customers/services/customer.service";
import { isAppError } from "@/packages/lib/errors";

export const metadata = { title: "Editar cliente" };

export default async function EditCustomerPage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.FACTURACION_CUSTOMER_MANAGE);

  let customer;
  try {
    customer = await getCustomerService(ctx.companyId, params.id);
  } catch (err) {
    if (isAppError(err) && err.code === "NOT_FOUND") notFound();
    throw err;
  }

  return (
    <div>
      <PageHeader
        title={customer.legalName}
        description={customer.tradeName ?? undefined}
        breadcrumbs={[
          { label: "Facturación", href: "/facturacion" },
          { label: "Clientes", href: "/facturacion/customers" },
          { label: customer.legalName },
        ]}
      />
      <div className="mx-auto max-w-4xl p-6 lg:p-8">
        <CustomerForm
          mode="edit"
          id={customer.id}
          defaultValues={{
            code: customer.code,
            type: customer.type,
            legalName: customer.legalName,
            tradeName: customer.tradeName,
            documentNumber: customer.documentNumber,
            email: customer.email,
            phone: customer.phone,
            mobile: customer.mobile,
            address: customer.address,
            city: customer.city,
            country: customer.country,
            creditLimit: Number(customer.creditLimit),
            notes: customer.notes,
            tags: customer.tags,
            isActive: customer.isActive,
          }}
        />
      </div>
    </div>
  );
}
