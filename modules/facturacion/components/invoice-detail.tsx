"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle, Ban, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormField } from "@/components/shared/form-field";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/packages/lib/decimal";
import {
  confirmInvoiceAction,
  voidInvoiceAction,
  addPaymentAction,
} from "../actions/invoice.actions";
import { addPaymentSchema, type AddPaymentInput } from "../schemas/invoice.schema";

type InvoiceWithRelations = {
  id: string;
  number: string;
  ncf: string | null;
  status: string;
  total: { toString(): string };
  paidAmount: { toString(): string };
  balanceDue: { toString(): string };
  subtotal: { toString(): string };
  taxTotal: { toString(): string };
  discountTotal: { toString(): string };
  tipAmount: { toString(): string };
  notes: string | null;
  isCredit: boolean;
  voidReason: string | null;
  issueDate: Date;
  dueDate: Date | null;
  inventorySyncStatus: string;
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
  payments: Array<{
    id: string;
    method: string;
    amount: { toString(): string };
    receivedAt: Date;
    reference: string | null;
  }>;
};

export function InvoiceDetail({ invoice }: { invoice: InvoiceWithRelations }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [payOpen, setPayOpen] = useState(false);

  const balanceNum = Number(invoice.balanceDue);
  const canConfirm = invoice.status === "DRAFT";
  const canVoid = ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status);
  const canPay = balanceNum > 0 && ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status);

  function handleConfirm() {
    startTransition(async () => {
      const r = await confirmInvoiceAction(invoice.id);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success(r.data.ncf ? `Factura confirmada (${r.data.ncf})` : "Factura confirmada");
      router.refresh();
    });
  }

  function handleVoid() {
    if (voidReason.length < 5) {
      toast.error("La razón debe tener al menos 5 caracteres");
      return;
    }
    startTransition(async () => {
      const r = await voidInvoiceAction({ invoiceId: invoice.id, reason: voidReason });
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Factura anulada");
      setVoidOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <p className="font-mono text-lg font-semibold">{invoice.number}</p>
              {invoice.ncf && (
                <p className="font-mono text-sm text-muted-foreground">{invoice.ncf}</p>
              )}
              <StatusBadge status={invoice.status} />
              <StatusBadge status={invoice.inventorySyncStatus} />
            </div>
            <p className="text-sm text-muted-foreground">
              {invoice.customer.legalName}
              {invoice.customer.documentNumber && ` · ${invoice.customer.documentNumber}`}
            </p>
            <p className="text-xs text-muted-foreground">
              Emisión: {new Date(invoice.issueDate).toLocaleDateString("es-DO")}
              {invoice.dueDate && ` · Vence: ${new Date(invoice.dueDate).toLocaleDateString("es-DO")}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canConfirm && (
              <Button onClick={handleConfirm} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Confirmar factura
              </Button>
            )}
            {canPay && (
              <AddPaymentDialog
                open={payOpen}
                onOpenChange={setPayOpen}
                invoiceId={invoice.id}
                balanceDue={balanceNum}
              />
            )}
            {canVoid && (
              <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Ban className="h-4 w-4" />
                    Anular
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>¿Anular factura {invoice.number}?</DialogTitle>
                  </DialogHeader>
                  <FormField label="Razón de anulación" required>
                    <Textarea
                      value={voidReason}
                      onChange={(e) => setVoidReason(e.target.value)}
                      rows={3}
                      placeholder="Documenta por qué se anula esta factura"
                    />
                  </FormField>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setVoidOpen(false)}>
                      Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleVoid} disabled={isPending}>
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar anulación"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {invoice.voidReason && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm">
              <strong className="text-destructive">Anulada:</strong> {invoice.voidReason}
            </p>
          </CardContent>
        </Card>
      )}

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
              {invoice.items.map((it) => (
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
              <span className="font-mono">{formatCurrency(invoice.subtotal.toString())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Descuento</span>
              <span className="font-mono">- {formatCurrency(invoice.discountTotal.toString())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ITBIS</span>
              <span className="font-mono">{formatCurrency(invoice.taxTotal.toString())}</span>
            </div>
            {Number(invoice.tipAmount) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Propina</span>
                <span className="font-mono">{formatCurrency(invoice.tipAmount.toString())}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(invoice.total.toString())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pagado</span>
              <span className="font-mono">{formatCurrency(invoice.paidAmount.toString())}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold text-warning">
              <span>Balance</span>
              <span className="font-mono">{formatCurrency(invoice.balanceDue.toString())}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pagos recibidos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs">
                      {new Date(p.receivedAt).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" })}
                    </TableCell>
                    <TableCell className="text-xs">{p.method}</TableCell>
                    <TableCell className="font-mono text-xs">{p.reference ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(p.amount.toString())}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {invoice.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AddPaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  balanceDue,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoiceId: string;
  balanceDue: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<AddPaymentInput>({
    resolver: zodResolver(addPaymentSchema),
    defaultValues: {
      invoiceId,
      amount: balanceDue,
      method: "CASH",
      receivedAt: new Date(),
    },
  });

  function onSubmit(data: AddPaymentInput) {
    startTransition(async () => {
      const r = await addPaymentAction(data);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Pago registrado");
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <CreditCard className="h-4 w-4" />
          Registrar pago
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Monto" required>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={balanceDue}
              {...form.register("amount")}
            />
          </FormField>
          <FormField label="Método" required>
            <Select
              value={form.watch("method")}
              onValueChange={(v) => form.setValue("method", v as AddPaymentInput["method"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Efectivo</SelectItem>
                <SelectItem value="CARD">Tarjeta</SelectItem>
                <SelectItem value="TRANSFER">Transferencia</SelectItem>
                <SelectItem value="CHECK">Cheque</SelectItem>
                <SelectItem value="DIGITAL_WALLET">Billetera digital</SelectItem>
                <SelectItem value="OTHER">Otro</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Referencia" hint="Número de cheque, transacción...">
            <Input {...form.register("reference")} />
          </FormField>
          <FormField label="Notas">
            <Textarea {...form.register("notes")} rows={2} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
