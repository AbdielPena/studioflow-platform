"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/shared/form-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { branchFormSchema, type BranchFormInput } from "../schemas";
import {
  createBranchAction,
  updateBranchAction,
  deleteBranchAction,
} from "../actions/settings.actions";

export function BranchForm({
  mode,
  id,
  defaultValues,
}: {
  mode: "create" | "edit";
  id?: string;
  defaultValues?: Partial<BranchFormInput>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<BranchFormInput>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: { code: "", name: "", isMain: false, isActive: true, ...defaultValues },
  });

  function onSubmit(data: BranchFormInput) {
    startTransition(async () => {
      const r = mode === "create" ? await createBranchAction(data) : await updateBranchAction(id!, data);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success(mode === "create" ? "Sucursal creada" : "Cambios guardados");
      router.push("/settings/branches");
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const r = await deleteBranchAction(id!);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Sucursal eliminada");
      router.push("/settings/branches");
      router.refresh();
    });
  }

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sucursal</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Código" required error={errors.code?.message}>
            <Input {...form.register("code")} placeholder="MAIN" />
          </FormField>
          <FormField label="Nombre" required error={errors.name?.message}>
            <Input {...form.register("name")} placeholder="Sucursal Principal" />
          </FormField>
          <FormField label="Teléfono">
            <Input {...form.register("phone")} />
          </FormField>
          <FormField label="Sucursal principal">
            <div className="flex h-10 items-center gap-3 rounded-xl border bg-background px-3">
              <Switch
                checked={form.watch("isMain")}
                onCheckedChange={(v) => form.setValue("isMain", v)}
              />
              <span className="text-sm">{form.watch("isMain") ? "Sí (única)" : "No"}</span>
            </div>
          </FormField>
          <FormField label="Dirección" className="md:col-span-2">
            <Textarea {...form.register("address")} rows={2} />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => router.push("/settings/branches")}>
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
              title="¿Eliminar sucursal?"
              description="No podrás eliminarla si es la principal."
              destructive
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
