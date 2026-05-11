"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft, Trash2 } from "lucide-react";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { productFormSchema, type ProductFormInput } from "../schemas/product.schema";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
} from "../actions/product.actions";

type Props = {
  mode: "create" | "edit";
  id?: string;
  defaultValues?: Partial<ProductFormInput>;
  categories: Array<{ id: string; name: string }>;
};

export function ProductForm({ mode, id, defaultValues, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      type: "PRODUCT",
      sku: "",
      name: "",
      unit: "UND",
      price: 0,
      taxConfigKey: "ITBIS_18",
      isActive: true,
      ...defaultValues,
    },
  });

  function onSubmit(data: ProductFormInput) {
    startTransition(async () => {
      const r = mode === "create" ? await createProductAction(data) : await updateProductAction(id!, data);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success(mode === "create" ? "Producto creado" : "Cambios guardados");
      router.push("/facturacion/products");
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const r = await deleteProductAction(id!);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Producto eliminado");
      router.push("/facturacion/products");
      router.refresh();
    });
  }

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos del producto / servicio</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Tipo" required>
            <Select
              value={form.watch("type")}
              onValueChange={(v) => form.setValue("type", v as ProductFormInput["type"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRODUCT">Producto físico</SelectItem>
                <SelectItem value="SERVICE">Servicio</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="SKU" required error={errors.sku?.message}>
            <Input {...form.register("sku")} placeholder="PROD-001" />
          </FormField>

          <FormField label="Nombre" required error={errors.name?.message} className="md:col-span-2">
            <Input {...form.register("name")} placeholder="Nombre del producto" />
          </FormField>

          <FormField label="Código de barras">
            <Input {...form.register("barcode")} placeholder="7501234567890" />
          </FormField>

          <FormField label="Unidad" hint="UND, KG, LT, HR...">
            <Input {...form.register("unit")} placeholder="UND" />
          </FormField>

          <FormField label="Descripción" className="md:col-span-2">
            <Textarea {...form.register("description")} rows={3} />
          </FormField>

          <FormField label="Categoría">
            <Select
              value={form.watch("categoryId") ?? ""}
              onValueChange={(v) => form.setValue("categoryId", v || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin categoría</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Estado">
            <div className="flex h-10 items-center gap-3 rounded-xl border bg-background px-3">
              <Switch
                checked={form.watch("isActive")}
                onCheckedChange={(v) => form.setValue("isActive", v)}
              />
              <span className="text-sm">{form.watch("isActive") ? "Activo" : "Inactivo"}</span>
            </div>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Precio e impuestos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <FormField label="Precio venta (DOP)" required error={errors.price?.message}>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...form.register("price")}
              placeholder="0.00"
            />
          </FormField>
          <FormField label="Costo referencial (DOP)" hint="Opcional, para reportes">
            <Input
              type="number"
              step="0.01"
              min="0"
              {...form.register("costReference")}
              placeholder="0.00"
            />
          </FormField>
          <FormField label="Impuesto aplicable">
            <Select
              value={form.watch("taxConfigKey")}
              onValueChange={(v) => form.setValue("taxConfigKey", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ITBIS_18">ITBIS 18%</SelectItem>
                <SelectItem value="ITBIS_16">ITBIS 16%</SelectItem>
                <SelectItem value="ITBIS_0">ITBIS 0%</SelectItem>
                <SelectItem value="EXENTO">Exento</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vínculo con inventario externo</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            label="ID externo"
            hint="ID del producto en tu sistema de inventario externo"
          >
            <Input {...form.register("externalId")} placeholder="SKU-EXTERNAL-001" />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/facturacion/products")}
          disabled={isPending}
        >
          <ArrowLeft className="h-4 w-4" />
          Cancelar
        </Button>
        <div className="flex items-center gap-2">
          {mode === "edit" && id && (
            <ConfirmDialog
              trigger={
                <Button type="button" variant="outline" disabled={isPending}>
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              }
              title="¿Eliminar producto?"
              description="Soft delete. El producto desaparece de listados pero queda en histórico de facturas."
              destructive
              confirmLabel="Eliminar"
              onConfirm={handleDelete}
            />
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {mode === "create" ? "Crear producto" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </form>
  );
}
