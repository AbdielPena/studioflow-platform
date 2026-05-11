import { notFound } from "next/navigation";
import { requireCompany } from "@/packages/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { QuoteDetail } from "@/modules/facturacion/components/quote-detail";
import { getQuoteService } from "@/modules/facturacion/services/quote.service";
import { isAppError } from "@/packages/lib/errors";

export const metadata = { title: "Cotización" };

export default async function QuotePage({ params }: { params: { id: string } }) {
  const ctx = await requireCompany();

  let quote;
  try {
    quote = await getQuoteService(ctx.companyId, params.id);
  } catch (err) {
    if (isAppError(err) && err.code === "NOT_FOUND") notFound();
    throw err;
  }

  return (
    <div>
      <PageHeader
        title={`Cotización ${quote.number}`}
        breadcrumbs={[
          { label: "Facturación", href: "/facturacion" },
          { label: "Cotizaciones", href: "/facturacion/quotes" },
          { label: quote.number },
        ]}
      />
      <div className="mx-auto max-w-5xl p-6 lg:p-8">
        <QuoteDetail quote={quote} />
      </div>
    </div>
  );
}
