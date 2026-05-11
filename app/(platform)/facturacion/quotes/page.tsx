import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { QuotesTable } from "@/modules/facturacion/components/quotes-table";
import { listQuotesService } from "@/modules/facturacion/services/quote.service";

export const metadata = { title: "Cotizaciones" };

export default async function QuotesPage() {
  const ctx = await requireCompany();
  const quotes = await listQuotesService(ctx.companyId);

  return (
    <div>
      <PageHeader
        title="Cotizaciones"
        description="Crea cotizaciones y conviértelas en facturas con un click."
        breadcrumbs={[
          { label: "Facturación", href: "/facturacion" },
          { label: "Cotizaciones" },
        ]}
        actions={
          <Button asChild>
            <Link href="/facturacion/quotes/new">
              <Plus className="h-4 w-4" />
              Nueva cotización
            </Link>
          </Button>
        }
      />
      <div className="p-6 lg:p-8">
        {quotes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Sin cotizaciones"
            actionLabel="Crear cotización"
            actionHref="/facturacion/quotes/new"
          />
        ) : (
          <QuotesTable quotes={quotes} />
        )}
      </div>
    </div>
  );
}
