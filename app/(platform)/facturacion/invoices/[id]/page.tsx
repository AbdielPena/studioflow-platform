import { notFound } from "next/navigation";
import { requireCompany } from "@/packages/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { PrintButton } from "@/components/shared/print-button";
import { SendInvoiceByEmailButton } from "@/modules/facturacion/components/send-email-button";
import { InvoiceDetail } from "@/modules/facturacion/components/invoice-detail";
import { getInvoiceService } from "@/modules/facturacion/services/invoice.service";
import { isAppError } from "@/packages/lib/errors";

export const metadata = { title: "Factura" };

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const ctx = await requireCompany();

  let invoice;
  try {
    invoice = await getInvoiceService(ctx.companyId, params.id);
  } catch (err) {
    if (isAppError(err) && err.code === "NOT_FOUND") notFound();
    throw err;
  }

  return (
    <div>
      <PageHeader
        title={`Factura ${invoice.number}`}
        description={invoice.ncf ?? "Sin NCF asignado"}
        breadcrumbs={[
          { label: "Facturación", href: "/facturacion" },
          { label: invoice.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <SendInvoiceByEmailButton invoiceId={invoice.id} defaultEmail={invoice.customer.email} />
            <PrintButton href={`/print/invoice/${invoice.id}`} />
          </div>
        }
      />
      <div className="mx-auto max-w-5xl p-6 lg:p-8">
        <InvoiceDetail invoice={invoice} />
      </div>
    </div>
  );
}
