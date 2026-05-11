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
import { supplierFormSchema, type SupplierFormInput } from "../schemas/supplier.schema";
import {
  createSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
} from "../actions/supplier.actions";

type Props = {
  mode: "create" | "edit";
  id?: string;
  defaultValues?: Partial<SupplierFormInput>;
};

export function SupplierForm({ mode, id, defaultValues }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<SupplierFormInput>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      legalName: "",
      paymentTerms: 0,
      status: "ACTIVE",
      ...defaultValues,
    },
  });

  function onSubmit(data: SupplierFormInput) {
    startTransition(async () => {
      const r = mode === "create" ? await createSupplierAction(data) : await updateSupplierAction(id!, data);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success(mode === "create" ? "Suplidor creado" : "Cambios guardados");
      router.push("/facturacion/suppliers");
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const r = await deleteSupplierAction(id!);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Suplidor eliminado");
      router.push("/facturacion/suppliers");
      router.refresh();
    });
  }

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos del suplidor</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Código" hint="Opcional">
            <Input {...form.register("code")} placeholder="SUP-001" />
          </FormField>
          <FormField label="Estado">
            <Select
              value={form.watch("status")}
              onValueChange={(v) => form.setValue("status", v as "ACTIVE" | "INACTIVE")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="INACTIVE">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Razón social" required error={errors.legalName?.message} className="md:col-span-2">
            <Input {...form.register("legalName")} placeholder="Suplidor SRL" />
          </FormField>
          <FormField label="Nombre comercial">
            <Input {...form.register("tradeName")} />
          </FormField>
          <FormField label="RNC">
            <Input {...form.register("documentNumber")} placeholder="131000000" />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacto y términos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Correo">
            <Input type="email" {...form.register("email")} />
          </FormField>
          <FormField label="Teléfono">
            <Input {...form.register("phone")} />
          </FormField>
          <FormField label="Dirección" className="md:col-span-2">
            <Textarea {...form.register("address")} rows={2} />
          </FormField>
          <FormField label="Días de plazo de pago" hint="0 = contado">
            <Input type="number" min="0" {...form.register("paymentTerms")} />
          </FormField>
          <FormField label="Notas" className="md:col-span-2">
            <Textarea {...form.register("notes")} rows={3} />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/facturacion/suppliers")}
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
              title="¿Eliminar suplidor?"
              description="Soft delete. No se borran las compras históricas asociadas."
              destructive
              confirmLabel="Eliminar"
              onConfirm={handleDelete}
            />
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {mode === "create" ? "Crear" : "Guardar"}
          </Button>
        </div>
      </div>
    </form>
  );
}
