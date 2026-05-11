import { redirect } from "next/navigation";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { prisma } from "@/packages/db";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceForm } from "@/modules/facturacion/components/invoice-form";

export const metadata = { title: "Nueva factura" };

export default async function NewInvoicePage() {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.FACTURACION_INVOICE_CREATE);

  const [customers, products, branches, taxes] = await Promise.all([
    prisma.customer.findMany({
      where: { companyId: ctx.companyId, deletedAt: null, isActive: true },
      select: { id: true, legalName: true, documentNumber: true },
      orderBy: { legalName: "asc" },
      take: 500,
    }),
    prisma.product.findMany({
      where: { companyId: ctx.companyId, deletedAt: null, isActive: true },
      select: { id: true, name: true, sku: true, price: true, taxConfigKey: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.branch.findMany({
      where: { companyId: ctx.companyId, deletedAt: null, isActive: true },
      select: { id: true, name: true },
      orderBy: [{ isMain: "desc" }, { name: "asc" }],
    }),
    prisma.taxConfig.findMany({
      where: { companyId: ctx.companyId, isActive: true },
      select: { key: true, rate: true, name: true },
    }),
  ]);

  if (customers.length === 0) redirect("/facturacion/customers/new?from=invoice");
  if (products.length === 0) redirect("/facturacion/products/new?from=invoice");

  return (
    <div>
      <PageHeader
        title="Nueva factura"
        breadcrumbs={[
          { label: "Facturación", href: "/facturacion" },
          { label: "Nueva factura" },
        ]}
      />
      <div className="mx-auto max-w-5xl p-6 lg:p-8">
        <InvoiceForm
          customers={customers}
          products={products.map((p) => ({ ...p, price: p.price.toString() }))}
          branches={branches}
          taxes={taxes.map((t) => ({ ...t, rate: t.rate.toString() }))}
        />
      </div>
    </div>
  );
}
