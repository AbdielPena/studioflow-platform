import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { InvoicesTable } from "@/modules/facturacion/components/invoices-table";
import { listInvoicesService } from "@/modules/facturacion/services/invoice.service";

export const metadata = { title: "Facturación" };

export default async function FacturacionPage() {
  const ctx = await requireCompany();
  const invoices = await listInvoicesService({ companyId: ctx.companyId });

  return (
    <div>
      <PageHeader
        title="Facturación"
        description="Facturas fiscales, comprobantes y pagos."
        breadcrumbs={[{ label: "Facturación" }]}
        actions={
          <Button asChild>
            <Link href="/facturacion/invoices/new">
              <Plus className="h-4 w-4" />
              Nueva factura
            </Link>
          </Button>
        }
      />
      <div className="p-6 lg:p-8">
        {invoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Sin facturas todavía"
            description="Crea tu primera factura para empezar."
            actionLabel="Nueva factura"
            actionHref="/facturacion/invoices/new"
          />
        ) : (
          <InvoicesTable invoices={invoices} />
        )}
      </div>
    </div>
  );
}
