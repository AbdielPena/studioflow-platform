import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { prisma } from "@/packages/db";
import { PageHeader } from "@/components/shared/page-header";
import { PosInterface } from "@/modules/facturacion/components/pos-interface";

export const metadata = { title: "POS" };

export default async function PosPage() {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.FACTURACION_POS_USE);

  const [products, customers, taxes, activeSessions] = await Promise.all([
    prisma.product.findMany({
      where: { companyId: ctx.companyId, deletedAt: null, isActive: true },
      include: { category: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.customer.findMany({
      where: { companyId: ctx.companyId, deletedAt: null, isActive: true },
      select: { id: true, legalName: true, documentNumber: true, type: true },
      orderBy: [{ type: "asc" }, { legalName: "asc" }],
      take: 200,
    }),
    prisma.taxConfig.findMany({
      where: { companyId: ctx.companyId, isActive: true },
      select: { key: true, rate: true },
    }),
    prisma.cashSession.findMany({
      where: {
        userId: ctx.userId,
        status: "OPEN",
        cashRegister: { companyId: ctx.companyId, deletedAt: null },
      },
      include: { cashRegister: true },
      take: 1,
    }),
  ]);

  const active = activeSessions[0];

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        title="Punto de Venta"
        description="Búsqueda rápida + carrito táctil + multi-pago"
        breadcrumbs={[{ label: "Facturación", href: "/facturacion" }, { label: "POS" }]}
      />
      <div className="flex-1 overflow-hidden p-4 lg:p-6">
        <PosInterface
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            barcode: p.barcode,
            price: p.price.toString(),
            taxConfigKey: p.taxConfigKey,
            categoryName: p.category?.name ?? null,
          }))}
          customers={customers.map((c) => ({
            id: c.id,
            legalName: c.legalName,
            documentNumber: c.documentNumber,
          }))}
          taxes={taxes.map((t) => ({ key: t.key, rate: t.rate.toString() }))}
          activeSession={
            active
              ? {
                  id: active.id,
                  cashRegisterName: active.cashRegister.name,
                  openedAt: active.openedAt,
                }
              : null
          }
        />
      </div>
    </div>
  );
}
