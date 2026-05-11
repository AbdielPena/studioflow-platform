import { redirect } from "next/navigation";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { prisma } from "@/packages/db";
import { PageHeader } from "@/components/shared/page-header";
import { PurchaseForm } from "@/modules/purchases/components/purchase-form";

export const metadata = { title: "Nueva compra" };

export default async function NewPurchasePage() {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.PURCHASE_CREATE);

  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({
      where: { companyId: ctx.companyId, deletedAt: null, status: "ACTIVE" },
      select: { id: true, legalName: true },
      orderBy: { legalName: "asc" },
    }),
    prisma.product.findMany({
      where: { companyId: ctx.companyId, deletedAt: null, isActive: true },
      select: { id: true, name: true, sku: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (suppliers.length === 0) redirect("/facturacion/suppliers/new?from=purchase");

  return (
    <div>
      <PageHeader
        title="Nueva compra"
        breadcrumbs={[
          { label: "Facturación", href: "/facturacion" },
          { label: "Compras", href: "/facturacion/purchases" },
          { label: "Nueva" },
        ]}
      />
      <div className="mx-auto max-w-5xl p-6 lg:p-8">
        <PurchaseForm suppliers={suppliers} products={products} />
      </div>
    </div>
  );
}
