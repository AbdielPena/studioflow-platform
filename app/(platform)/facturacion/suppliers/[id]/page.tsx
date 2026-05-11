import { notFound } from "next/navigation";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { SupplierForm } from "@/modules/suppliers/components/supplier-form";
import { getSupplierService } from "@/modules/suppliers/services/supplier.service";
import { isAppError } from "@/packages/lib/errors";

export const metadata = { title: "Editar suplidor" };

export default async function EditSupplierPage({ params }: { params: { id: string } }) {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.SUPPLIER_MANAGE);

  let supplier;
  try {
    supplier = await getSupplierService(ctx.companyId, params.id);
  } catch (err) {
    if (isAppError(err) && err.code === "NOT_FOUND") notFound();
    throw err;
  }

  return (
    <div>
      <PageHeader
        title={supplier.legalName}
        description={supplier.tradeName ?? undefined}
        breadcrumbs={[
          { label: "Facturación", href: "/facturacion" },
          { label: "Suplidores", href: "/facturacion/suppliers" },
          { label: supplier.legalName },
        ]}
      />
      <div className="mx-auto max-w-4xl p-6 lg:p-8">
        <SupplierForm
          mode="edit"
          id={supplier.id}
          defaultValues={{
            code: supplier.code,
            legalName: supplier.legalName,
            tradeName: supplier.tradeName,
            documentNumber: supplier.documentNumber,
            email: supplier.email,
            phone: supplier.phone,
            address: supplier.address,
            paymentTerms: supplier.paymentTerms,
            status: supplier.status,
            notes: supplier.notes,
          }}
        />
      </div>
    </div>
  );
}
