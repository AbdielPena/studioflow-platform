import { notFound } from "next/navigation";
import { requireCompany } from "@/packages/auth/session";
import { prisma } from "@/packages/db";
import { getQuoteService } from "@/modules/facturacion/services/quote.service";
import { isAppError } from "@/packages/lib/errors";
import { PrintToolbar } from "@/components/print/print-toolbar";
import { DocumentShell } from "@/components/print/document-shell";

export const metadata = { title: "Imprimir cotización" };

const STATUS_TONE = {
  DRAFT: { label: "Borrador", tone: "muted" as const },
  SENT: { label: "Enviada", tone: "warning" as const },
  APPROVED: { label: "Aprobada", tone: "success" as const },
  REJECTED: { label: "Rechazada", tone: "destructive" as const },
  EXPIRED: { label: "Vencida", tone: "destructive" as const },
  CONVERTED: { label: "Convertida", tone: "success" as const },
  CANCELLED: { label: "Cancelada", tone: "destructive" as const },
};

export default async function PrintQuotePage({ params }: { params: { id: string } }) {
  const ctx = await requireCompany();

  let quote;
  try {
    quote = await getQuoteService(ctx.companyId, params.id);
  } catch (err) {
    if (isAppError(err) && err.code === "NOT_FOUND") notFound();
    throw err;
  }

  const company = await prisma.company.findUniqueOrThrow({
    where: { id: ctx.companyId },
  });

  return (
    <>
      <PrintToolbar backHref={`/facturacion/quotes/${quote.id}`} />
      <DocumentShell
        documentType="Cotización"
        documentNumber={quote.number}
        issueDate={quote.issueDate}
        dueDate={quote.expiresAt}
        status={STATUS_TONE[quote.status]}
        company={{
          legalName: company.legalName,
          tradeName: company.tradeName,
          rnc: company.rnc,
          address: company.address,
          city: company.city,
          phone: company.phone,
          email: company.email,
        }}
        counterparty={{
          label: "Cliente",
          data: {
            legalName: quote.customer.legalName,
            documentNumber: quote.customer.documentNumber,
            address: quote.customer.address,
            email: quote.customer.email,
            phone: quote.customer.phone,
          },
        }}
        items={quote.items.map((it) => ({
          description: it.description,
          quantity: it.quantity.toString(),
          unitPrice: it.unitPrice.toString(),
          discount: it.discount.toString(),
          taxAmount: it.taxAmount.toString(),
          lineTotal: it.lineTotal.toString(),
        }))}
        subtotal={quote.subtotal.toString()}
        discountTotal={quote.discountTotal.toString()}
        taxTotal={quote.taxTotal.toString()}
        total={quote.total.toString()}
        notes={quote.notes}
        terms={quote.terms}
      />
    </>
  );
}
