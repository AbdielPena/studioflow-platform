"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
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
import { projectFormSchema, type ProjectFormInput } from "../schemas";
import { createProjectAction, updateProjectAction } from "../actions/crm.actions";

type Props = {
  mode: "create" | "edit";
  id?: string;
  defaultValues?: Partial<ProjectFormInput>;
  customers: Array<{ id: string; legalName: string }>;
};

export function ProjectForm({ mode, id, defaultValues, customers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProjectFormInput>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { customerId: "", name: "", status: "LEAD", ...defaultValues },
  });

  function onSubmit(data: ProjectFormInput) {
    startTransition(async () => {
      const r = mode === "create" ? await createProjectAction(data) : await updateProjectAction(id!, data);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success(mode === "create" ? "Proyecto creado" : "Cambios guardados");
      router.push("/crm/projects");
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Proyecto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Cliente" required>
            <Select
              value={form.watch("customerId")}
              onValueChange={(v) => form.setValue("customerId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
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
          <FormField label="Nombre" required>
            <Input {...form.register("name")} placeholder="Boda María & Juan" />
          </FormField>
          <FormField label="Estado">
            <Select
              value={form.watch("status")}
              onValueChange={(v) => form.setValue("status", v as ProjectFormInput["status"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LEAD">Lead</SelectItem>
                <SelectItem value="BOOKED">Confirmado</SelectItem>
                <SelectItem value="IN_PROGRESS">En proceso</SelectItem>
                <SelectItem value="EDITING">En edición</SelectItem>
                <SelectItem value="DELIVERED">Entregado</SelectItem>
                <SelectItem value="COMPLETED">Completado</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Monto (DOP)">
            <Input type="number" step="0.01" min="0" {...form.register("amount")} />
          </FormField>
          <FormField label="Fecha inicio">
            <Input type="date" {...form.register("startDate", { valueAsDate: true })} />
          </FormField>
          <FormField label="Fecha fin">
            <Input type="date" {...form.register("endDate", { valueAsDate: true })} />
          </FormField>
          <FormField label="Descripción" className="md:col-span-2">
            <Textarea {...form.register("description")} rows={3} />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {mode === "create" ? "Crear" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
