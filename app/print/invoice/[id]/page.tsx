import { notFound } from "next/navigation";
import { requireCompany } from "@/packages/auth/session";
import { prisma } from "@/packages/db";
import { getInvoiceService } from "@/modules/facturacion/services/invoice.service";
import { isAppError } from "@/packages/lib/errors";
import { PrintToolbar } from "@/components/print/print-toolbar";
import { DocumentShell } from "@/components/print/document-shell";

export const metadata = { title: "Imprimir factura" };

const STATUS_TONE = {
  DRAFT: { label: "Borrador", tone: "muted" as const },
  ISSUED: { label: "Emitida", tone: "success" as const },
  PARTIALLY_PAID: { label: "Pago parcial", tone: "warning" as const },
  PAID: { label: "Pagada", tone: "success" as const },
  OVERDUE: { label: "Vencida", tone: "destructive" as const },
  VOIDED: { label: "Anulada", tone: "destructive" as const },
  CANCELLED: { label: "Cancelada", tone: "destructive" as const },
};

export default async function PrintInvoicePage({ params }: { params: { id: string } }) {
  const ctx = await requireCompany();

  let invoice;
  try {
    invoice = await getInvoiceService(ctx.companyId, params.id);
  } catch (err) {
    if (isAppError(err) && err.code === "NOT_FOUND") notFound();
    throw err;
  }

  const company = await prisma.company.findUniqueOrThrow({
    where: { id: ctx.companyId },
  });

  return (
    <>
      <PrintToolbar backHref={`/facturacion/invoices/${invoice.id}`} />
      <DocumentShell
        documentType="Factura"
        documentNumber={invoice.number}
        ncf={invoice.ncf}
        issueDate={invoice.issueDate}
        dueDate={invoice.dueDate}
        status={STATUS_TONE[invoice.status]}
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
            legalName: invoice.customer.legalName,
            documentNumber: invoice.customer.documentNumber,
            address: invoice.customer.address,
            email: invoice.customer.email,
            phone: invoice.customer.phone,
          },
        }}
        items={invoice.items.map((it) => ({
          description: it.description,
          quantity: it.quantity.toString(),
          unitPrice: it.unitPrice.toString(),
          discount: it.discount.toString(),
          taxAmount: it.taxAmount.toString(),
          lineTotal: it.lineTotal.toString(),
        }))}
        subtotal={invoice.subtotal.toString()}
        discountTotal={invoice.discountTotal.toString()}
        taxTotal={invoice.taxTotal.toString()}
        total={invoice.total.toString()}
        paidAmount={invoice.paidAmount.toString()}
        balanceDue={invoice.balanceDue.toString()}
        notes={invoice.notes}
      />
    </>
  );
}
