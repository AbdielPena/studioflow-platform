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
import {
  customerFormSchema,
  type CustomerFormInput,
} from "../schemas/customer.schema";
import {
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
} from "../actions/customer.actions";

type Props = {
  mode: "create" | "edit";
  id?: string;
  defaultValues?: Partial<CustomerFormInput>;
};

export function CustomerForm({ mode, id, defaultValues }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CustomerFormInput>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      type: "INDIVIDUAL",
      legalName: "",
      country: "DO",
      creditLimit: 0,
      tags: [],
      isActive: true,
      ...defaultValues,
    },
  });

  function onSubmit(data: CustomerFormInput) {
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createCustomerAction(data)
          : await updateCustomerAction(id!, data);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success(mode === "create" ? "Cliente creado" : "Cliente actualizado");
      router.push("/facturacion/customers");
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCustomerAction(id!);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Cliente eliminado");
      router.push("/facturacion/customers");
      router.refresh();
    });
  }

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos básicos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Tipo de cliente" required>
            <Select
              value={form.watch("type")}
              onValueChange={(v) => form.setValue("type", v as CustomerFormInput["type"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                <SelectItem value="COMPANY">Empresa</SelectItem>
                <SelectItem value="FINAL_CONSUMER">Consumidor final</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Código" hint="Opcional, auto-asignable">
            <Input {...form.register("code")} placeholder="CLI-001" />
          </FormField>

          <FormField
            label="Nombre legal / razón social"
            required
            error={errors.legalName?.message}
            className="md:col-span-2"
          >
            <Input {...form.register("legalName")} placeholder="Juan Pérez / Empresa SRL" />
          </FormField>

          <FormField label="Nombre comercial">
            <Input {...form.register("tradeName")} />
          </FormField>

          <FormField
            label="RNC / Cédula"
            hint="9 u 11 dígitos"
            error={errors.documentNumber?.message}
          >
            <Input {...form.register("documentNumber")} placeholder="00112345678" />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Correo electrónico" error={errors.email?.message}>
            <Input type="email" {...form.register("email")} placeholder="cliente@correo.com" />
          </FormField>
          <FormField label="Teléfono fijo">
            <Input {...form.register("phone")} placeholder="809-000-0000" />
          </FormField>
          <FormField label="Celular">
            <Input {...form.register("mobile")} placeholder="809-000-0000" />
          </FormField>
          <FormField label="Ciudad">
            <Input {...form.register("city")} placeholder="Santo Domingo" />
          </FormField>
          <FormField label="Dirección" className="md:col-span-2">
            <Textarea {...form.register("address")} rows={2} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comercial</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Límite de crédito (DOP)" hint="0 = sin crédito">
            <Input
              type="number"
              step="0.01"
              min="0"
              {...form.register("creditLimit")}
              placeholder="0.00"
            />
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
          <FormField label="Notas internas" className="md:col-span-2">
            <Textarea {...form.register("notes")} rows={3} />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/facturacion/customers")}
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
              title="¿Eliminar cliente?"
              description="Esta acción es reversible (soft delete), pero el cliente dejará de aparecer en listados."
              destructive
              confirmLabel="Eliminar"
              onConfirm={handleDelete}
            />
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {mode === "create" ? "Crear cliente" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </form>
  );
}
