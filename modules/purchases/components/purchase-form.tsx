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
  createPurchaseSchema,
  type CreatePurchaseInput,
} from "../schemas/purchase.schema";
import { createPurchaseAction } from "../actions/purchase.actions";

type Props = {
  suppliers: Array<{ id: string; legalName: string }>;
  products: Array<{ id: string; name: string; sku: string }>;
};

export function PurchaseForm({ suppliers, products }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreatePurchaseInput>({
    resolver: zodResolver(createPurchaseSchema),
    defaultValues: {
      supplierId: "",
      isCredit: false,
      currency: "DOP",
      exchangeRate: 1,
      items: [
        { description: "", quantity: 1, unitCost: 0, taxRate: 0.18, position: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watched = form.watch("items");
  const totals = useMemo(() => {
    let subtotal = D(0);
    let taxTotal = D(0);
    for (const it of watched ?? []) {
      const sub = D(it.quantity || 0).times(D(it.unitCost || 0));
      const tax = sub.times(D(it.taxRate || 0));
      subtotal = subtotal.plus(sub);
      taxTotal = taxTotal.plus(tax);
    }
    return { subtotal, taxTotal, total: subtotal.plus(taxTotal) };
  }, [watched]);

  function onSubmit(data: CreatePurchaseInput) {
    startTransition(async () => {
      const r = await createPurchaseAction(data);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Compra registrada");
      router.push("/facturacion/purchases");
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Suplidor" required>
            <Select
              value={form.watch("supplierId")}
              onValueChange={(v) => form.setValue("supplierId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.legalName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="NCF del suplidor" hint="Tipo B11 normalmente">
            <Input {...form.register("ncfSupplier")} placeholder="B1100000001" />
          </FormField>
          <Card>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">Compra a crédito</p>
                <p className="text-xs text-muted-foreground">Genera CxP</p>
              </div>
              <Switch
                checked={form.watch("isCredit")}
                onCheckedChange={(v) => form.setValue("isCredit", v)}
              />
            </CardContent>
          </Card>
          {form.watch("isCredit") && (
            <FormField label="Vencimiento">
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
                  unitCost: 0,
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
            const it = watched?.[idx];
            const lineTotal = it
              ? D(it.quantity || 0)
                  .times(D(it.unitCost || 0))
                  .times(D(1).plus(D(it.taxRate || 0)))
              : D(0);
            return (
              <div key={f.id} className="grid gap-2 rounded-xl border bg-card/30 p-3 md:grid-cols-12">
                <Select
                  value={form.watch(`items.${idx}.productId`) ?? ""}
                  onValueChange={(v) => {
                    const p = products.find((x) => x.id === v);
                    form.setValue(`items.${idx}.productId`, v);
                    if (p) form.setValue(`items.${idx}.description`, p.name);
                  }}
                >
                  <SelectTrigger className="md:col-span-3">
                    <SelectValue placeholder="Producto (opcional)" />
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
                  className="md:col-span-4"
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
                  placeholder="Costo"
                  className="md:col-span-2"
                  {...form.register(`items.${idx}.unitCost`)}
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
        <CardContent className="space-y-1 p-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
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

      <FormField label="Notas">
        <Textarea {...form.register("notes")} rows={2} />
      </FormField>

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => router.push("/facturacion/purchases")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Registrar compra
        </Button>
      </div>
    </form>
  );
}
