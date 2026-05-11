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
import { createQuoteSchema, type CreateQuoteInput } from "../schemas/quote.schema";
import { createQuoteAction } from "../actions/quote.actions";

type Props = {
  customers: Array<{ id: string; legalName: string; documentNumber: string | null }>;
  products: Array<{ id: string; name: string; sku: string; price: string; taxConfigKey: string }>;
  taxes: Array<{ key: string; rate: string }>;
};

export function QuoteForm({ customers, products, taxes }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateQuoteInput>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: {
      customerId: "",
      currency: "DOP",
      exchangeRate: 1,
      items: [
        { description: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 0.18, position: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");

  const totals = useMemo(() => {
    let subtotal = D(0);
    let discountTotal = D(0);
    let taxTotal = D(0);
    for (const it of watchedItems ?? []) {
      const qty = D(it.quantity || 0);
      const price = D(it.unitPrice || 0);
      const sub = qty.times(price);
      const dis = D(it.discount || 0);
      const tax = sub.minus(dis).times(D(it.taxRate || 0));
      subtotal = subtotal.plus(sub);
      discountTotal = discountTotal.plus(dis);
      taxTotal = taxTotal.plus(tax);
    }
    return { subtotal, discountTotal, taxTotal, total: subtotal.minus(discountTotal).plus(taxTotal) };
  }, [watchedItems]);

  function onSubmit(data: CreateQuoteInput) {
    startTransition(async () => {
      const r = await createQuoteAction(data);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Cotización creada");
      router.push(`/facturacion/quotes/${r.data.id}`);
      router.refresh();
    });
  }

  function pickProduct(idx: number, pid: string) {
    const p = products.find((x) => x.id === pid);
    if (!p) return;
    const tax = taxes.find((t) => t.key === p.taxConfigKey);
    form.setValue(`items.${idx}.productId`, p.id);
    form.setValue(`items.${idx}.description`, p.name);
    form.setValue(`items.${idx}.unitPrice`, Number(p.price));
    form.setValue(`items.${idx}.taxRate`, tax ? Number(tax.rate) : 0.18);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Cliente" required className="md:col-span-2">
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
                    {c.legalName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Vence">
            <Input type="date" {...form.register("expiresAt", { valueAsDate: true })} />
          </FormField>
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
              Agregar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.map((f, idx) => {
            const it = watchedItems?.[idx];
            const lineTotal = it
              ? D(it.quantity || 0)
                  .times(D(it.unitPrice || 0))
                  .minus(D(it.discount || 0))
                  .times(D(1).plus(D(it.taxRate || 0)))
              : D(0);
            return (
              <div key={f.id} className="grid gap-2 rounded-xl border bg-card/30 p-3 md:grid-cols-12">
                <Select
                  value={form.watch(`items.${idx}.productId`) ?? ""}
                  onValueChange={(v) => pickProduct(idx, v)}
                >
                  <SelectTrigger className="md:col-span-4">
                    <SelectValue placeholder="Producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Descripción"
                  className="md:col-span-3"
                  {...form.register(`items.${idx}.description`)}
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Cant"
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
                  placeholder="Desc"
                  className="md:col-span-1"
                  {...form.register(`items.${idx}.discount`)}
                />
                <div className="flex items-center justify-end md:col-span-1">
                  <span className="text-xs font-medium">{formatCurrency(lineTotal)}</span>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
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
          <CardTitle>Notas y términos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Notas">
            <Textarea {...form.register("notes")} rows={3} />
          </FormField>
          <FormField label="Términos">
            <Textarea {...form.register("terms")} rows={3} placeholder="Validez 30 días, pago a contraentrega..." />
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
          <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
            <span>Total</span>
            <span className="font-mono">{formatCurrency(totals.total)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => router.push("/facturacion/quotes")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Crear cotización
        </Button>
      </div>
    </form>
  );
}
