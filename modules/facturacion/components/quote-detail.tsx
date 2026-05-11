"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Send, ArrowRight } from "lucide-react";
import { QuoteStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/packages/lib/decimal";
import { setQuoteStatusAction, convertQuoteAction } from "../actions/quote.actions";

type QuoteWithRelations = {
  id: string;
  number: string;
  status: QuoteStatus;
  total: { toString(): string };
  subtotal: { toString(): string };
  taxTotal: { toString(): string };
  discountTotal: { toString(): string };
  notes: string | null;
  terms: string | null;
  issueDate: Date;
  expiresAt: Date | null;
  customer: { id: string; legalName: string; documentNumber: string | null };
  items: Array<{
    id: string;
    description: string;
    quantity: { toString(): string };
    unitPrice: { toString(): string };
    discount: { toString(): string };
    taxAmount: { toString(): string };
    lineTotal: { toString(): string };
  }>;
  convertedInvoice: { id: string; number: string; status: string } | null;
};

export function QuoteDetail({ quote }: { quote: QuoteWithRelations }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function changeStatus(status: QuoteStatus) {
    startTransition(async () => {
      const r = await setQuoteStatusAction(quote.id, status);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Estado actualizado");
      router.refresh();
    });
  }

  function convert() {
    startTransition(async () => {
      const r = await convertQuoteAction(quote.id);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Cotización convertida a factura");
      router.push(`/facturacion/invoices/${r.data.invoiceId}`);
    });
  }

  const isFinal = quote.status === "CONVERTED" || quote.status === "CANCELLED" || quote.status === "REJECTED";

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <div className="flex items-center gap-3">
              <p className="font-mono text-lg font-semibold">{quote.number}</p>
              <StatusBadge status={quote.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {quote.customer.legalName}
            </p>
            <p className="text-xs text-muted-foreground">
              Emisión {new Date(quote.issueDate).toLocaleDateString("es-DO")}
              {quote.expiresAt && ` · Vence ${new Date(quote.expiresAt).toLocaleDateString("es-DO")}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {quote.convertedInvoice && (
              <Button variant="outline" asChild>
                <Link href={`/facturacion/invoices/${quote.convertedInvoice.id}`}>
                  Ver factura {quote.convertedInvoice.number}
                </Link>
              </Button>
            )}
            {quote.status === QuoteStatus.DRAFT && (
              <Button variant="outline" onClick={() => changeStatus(QuoteStatus.SENT)} disabled={isPending}>
                <Send className="h-4 w-4" />
                Marcar enviada
              </Button>
            )}
            {quote.status === QuoteStatus.SENT && (
              <>
                <Button variant="outline" onClick={() => changeStatus(QuoteStatus.APPROVED)} disabled={isPending}>
                  <CheckCircle className="h-4 w-4" />
                  Aprobada
                </Button>
                <Button variant="outline" onClick={() => changeStatus(QuoteStatus.REJECTED)} disabled={isPending}>
                  <XCircle className="h-4 w-4" />
                  Rechazada
                </Button>
              </>
            )}
            {!isFinal && quote.status !== QuoteStatus.DRAFT && (
              <Button onClick={convert} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Convertir a factura
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ítems</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Desc.</TableHead>
                <TableHead className="text-right">ITBIS</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quote.items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>{it.description}</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {Number(it.quantity).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(it.unitPrice.toString())}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {formatCurrency(it.discount.toString())}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {formatCurrency(it.taxAmount.toString())}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(it.lineTotal.toString())}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-6 ml-auto max-w-sm space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">{formatCurrency(quote.subtotal.toString())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Descuento</span>
              <span className="font-mono">- {formatCurrency(quote.discountTotal.toString())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ITBIS</span>
              <span className="font-mono">{formatCurrency(quote.taxTotal.toString())}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(quote.total.toString())}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {(quote.notes || quote.terms) && (
        <div className="grid gap-4 md:grid-cols-2">
          {quote.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{quote.notes}</p>
              </CardContent>
            </Card>
          )}
          {quote.terms && (
            <Card>
              <CardHeader>
                <CardTitle>Términos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{quote.terms}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
