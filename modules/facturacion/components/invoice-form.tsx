"use client";

import { useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { formatCurrency, D } from "@/packages/lib/decimal";
import {
  createInvoiceSchema,
  type CreateInvoiceInput,
} from "../schemas/invoice.schema";
import { createInvoiceAction } from "../actions/invoice.actions";

type Props = {
  customers: Array<{ id: string; legalName: string; documentNumber: string | null }>;
  products: Array<{ id: string; name: string; sku: string; price: string; taxConfigKey: string }>;
  branches: Array<{ id: string; name: string }>;
  taxes: Array<{ key: string; rate: string; name: string }>;
};

export function InvoiceForm({ customers, products, branches, taxes }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      customerId: "",
      paymentMethod: "CASH",
      isCredit: false,
      currency: "DOP",
      exchangeRate: 1,
      tipAmount: 0,
      items: [
        {
          description: "",
          quantity: 1,
          unitPrice: 0,
          discount: 0,
          taxRate: 0.18,
          position: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const watchedTip = form.watch("tipAmount") ?? 0;

  const totals = useMemo(() => {
    let subtotal = D(0);
    let discountTotal = D(0);
    let taxTotal = D(0);
    for (const it of watchedItems ?? []) {
      const qty = D(it.quantity || 0);
      const price = D(it.unitPrice || 0);
      const sub = qty.times(price);
      const dis = D(it.discount || 0);
      const taxableBase = sub.minus(dis);
      const tax = taxableBase.times(D(it.taxRate || 0));
      subtotal = subtotal.plus(sub);
      discountTotal = discountTotal.plus(dis);
      taxTotal = taxTotal.plus(tax);
    }
    const tip = D(watchedTip || 0);
    const total = subtotal.minus(discountTotal).plus(taxTotal).plus(tip);
    return { subtotal, discountTotal, taxTotal, tip, total };
  }, [watchedItems, watchedTip]);

  function onSubmit(data: CreateInvoiceInput) {
    startTransition(async () => {
      const r = await createInvoiceAction(data);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Factura creada en borrador");
      router.push(`/facturacion/invoices/${r.data.id}`);
      router.refresh();
    });
  }

  function pickProduct(index: number, productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    const taxKey = p.taxConfigKey;
    const tax = taxes.find((t) => t.key === taxKey);
    const taxRate = tax ? Number(tax.rate) : 0.18;
    form.setValue(`items.${index}.productId`, p.id);
    form.setValue(`items.${index}.description`, p.name);
    form.setValue(`items.${index}.unitPrice`, Number(p.price));
    form.setValue(`items.${index}.taxRate`, taxRate);
  }

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información general</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Cliente" required error={errors.customerId?.message} className="md:col-span-2">
            <Select
              value={form.watch("customerId")}
              onValueChange={(v) => form.setValue("customerId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.legalName} {c.documentNumber && `(${c.documentNumber})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Tipo NCF" hint="Opcional para borrador, requerido al confirmar">
            <Select
              value={form.watch("ncfType") ?? "NONE"}
              onValueChange={(v) =>
                form.setValue("ncfType", v === "NONE" ? null : (v as CreateInvoiceInput["ncfType"]))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin NCF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Sin NCF (no fiscal)</SelectItem>
                <SelectItem value="B02">B02 — Consumo</SelectItem>
                <SelectItem value="B01">B01 — Crédito Fiscal</SelectItem>
                <SelectItem value="B14">B14 — Régimen Especial</SelectItem>
                <SelectItem value="B15">B15 — Gubernamental</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Sucursal">
            <Select
              value={form.watch("branchId") ?? "NONE"}
              onValueChange={(v) => form.setValue("branchId", v === "NONE" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin sucursal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Sin sucursal</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Método de pago">
            <Select
              value={form.watch("paymentMethod")}
              onValueChange={(v) => form.setValue("paymentMethod", v as CreateInvoiceInput["paymentMethod"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Efectivo</SelectItem>
                <SelectItem value="CARD">Tarjeta</SelectItem>
                <SelectItem value="TRANSFER">Transferencia</SelectItem>
                <SelectItem value="CHECK">Cheque</SelectItem>
                <SelectItem value="CREDIT">Crédito</SelectItem>
                <SelectItem value="MIXED">Mixto</SelectItem>
                <SelectItem value="DIGITAL_WALLET">Billetera digital</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <Card>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">Factura a crédito</p>
                <p className="text-xs text-muted-foreground">Genera CxC automática al confirmar</p>
              </div>
              <Switch
                checked={form.watch("isCredit")}
                onCheckedChange={(v) => form.setValue("isCredit", v)}
              />
            </CardContent>
          </Card>
          {form.watch("isCredit") && (
            <FormField label="Fecha vencimiento">
              <Input type="date" {...form.register("dueDate", { valueAsDate: true })} />
            </FormField>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Ítems
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                append({
                  description: "",
                  quantity: 1,
                  unitPrice: 0,
                  discount: 0,
                  taxRate: 0.18,
                  position: fields.length,
                })
              }
            >
              <Plus className="h-4 w-4" />
              Agregar ítem
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((f, idx) => {
            const item = watchedItems?.[idx];
            const lineTotal = item
              ? D(item.quantity || 0)
                  .times(D(item.unitPrice || 0))
                  .minus(D(item.discount || 0))
                  .times(D(1).plus(D(item.taxRate || 0)))
              : D(0);
            return (
              <div key={f.id} className="grid gap-3 rounded-xl border bg-card/30 p-3 md:grid-cols-12">
                <div className="md:col-span-4">
                  <Select
                    value={form.watch(`items.${idx}.productId`) ?? ""}
                    onValueChange={(v) => pickProduct(idx, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Producto / servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  className="md:col-span-3"
                  placeholder="Descripción"
                  {...form.register(`items.${idx}.description`)}
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Cantidad"
                  className="md:col-span-1"
                  {...form.register(`items.${idx}.quantity`)}
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Precio"
                  className="md:col-span-1"
                  {...form.register(`items.${idx}.unitPrice`)}
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Desc."
                  className="md:col-span-1"
                  {...form.register(`items.${idx}.discount`)}
                />
                <div className="flex items-center justify-end md:col-span-1">
                  <span className="text-xs font-medium">{formatCurrency(lineTotal)}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(idx)}
                  disabled={fields.length === 1}
                  className="md:col-span-1"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Totales y notas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <FormField label="Propina (DOP)">
            <Input type="number" step="0.01" min="0" {...form.register("tipAmount")} />
          </FormField>
          <FormField label="Moneda">
            <Input {...form.register("currency")} maxLength={3} />
          </FormField>
          <FormField label="Tasa de cambio">
            <Input type="number" step="0.0001" min="0" {...form.register("exchangeRate")} />
          </FormField>
          <FormField label="Notas" className="md:col-span-3">
            <Textarea {...form.register("notes")} rows={2} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1 p-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Descuento</span>
            <span className="font-mono">- {formatCurrency(totals.discountTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">ITBIS</span>
            <span className="font-mono">{formatCurrency(totals.taxTotal)}</span>
          </div>
          {!totals.tip.isZero() && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Propina</span>
              <span className="font-mono">{formatCurrency(totals.tip)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
            <span>Total</span>
            <span className="font-mono">{formatCurrency(totals.total)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => router.push("/facturacion")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar borrador
        </Button>
      </div>
    </form>
  );
}
