import { redirect } from "next/navigation";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { prisma } from "@/packages/db";
import { PageHeader } from "@/components/shared/page-header";
import { QuoteForm } from "@/modules/facturacion/components/quote-form";

export const metadata = { title: "Nueva cotización" };

export default async function NewQuotePage() {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.FACTURACION_QUOTE_CREATE);

  const [customers, products, taxes] = await Promise.all([
    prisma.customer.findMany({
      where: { companyId: ctx.companyId, deletedAt: null, isActive: true },
      select: { id: true, legalName: true, documentNumber: true },
      orderBy: { legalName: "asc" },
    }),
    prisma.product.findMany({
      where: { companyId: ctx.companyId, deletedAt: null, isActive: true },
      select: { id: true, name: true, sku: true, price: true, taxConfigKey: true },
      orderBy: { name: "asc" },
    }),
    prisma.taxConfig.findMany({
      where: { companyId: ctx.companyId, isActive: true },
      select: { key: true, rate: true },
    }),
  ]);

  if (customers.length === 0) redirect("/facturacion/customers/new?from=quote");
  if (products.length === 0) redirect("/facturacion/products/new?from=quote");

  return (
    <div>
      <PageHeader
        title="Nueva cotización"
        breadcrumbs={[
          { label: "Facturación", href: "/facturacion" },
          { label: "Cotizaciones", href: "/facturacion/quotes" },
          { label: "Nueva" },
        ]}
      />
      <div className="mx-auto max-w-5xl p-6 lg:p-8">
        <QuoteForm
          customers={customers}
          products={products.map((p) => ({ ...p, price: p.price.toString() }))}
          taxes={taxes.map((t) => ({ key: t.key, rate: t.rate.toString() }))}
        />
      </div>
    </div>
  );
}
