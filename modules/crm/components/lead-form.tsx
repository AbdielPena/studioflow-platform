"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";
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
import { leadFormSchema, type LeadFormInput } from "../schemas";
import { createLeadAction, updateLeadAction } from "../actions/crm.actions";

type Props = {
  mode: "create" | "edit";
  id?: string;
  defaultValues?: Partial<LeadFormInput>;
  customers: Array<{ id: string; legalName: string }>;
};

export function LeadForm({ mode, id, defaultValues, customers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<LeadFormInput>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      stage: "NEW",
      ...defaultValues,
    },
  });

  function onSubmit(data: LeadFormInput) {
    startTransition(async () => {
      const r = mode === "create" ? await createLeadAction(data) : await updateLeadAction(id!, data);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success(mode === "create" ? "Lead creado" : "Cambios guardados");
      router.push("/crm/leads");
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del lead</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Nombre" required className="md:col-span-2">
            <Input {...form.register("name")} placeholder="Nombre del contacto" />
          </FormField>
          <FormField label="Correo">
            <Input type="email" {...form.register("email")} />
          </FormField>
          <FormField label="Teléfono">
            <Input {...form.register("phone")} />
          </FormField>
          <FormField label="Fuente" hint="Web, referido, redes...">
            <Input {...form.register("source")} placeholder="Web / Instagram / Referido" />
          </FormField>
          <FormField label="Etapa">
            <Select
              value={form.watch("stage")}
              onValueChange={(v) => form.setValue("stage", v as LeadFormInput["stage"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">Nuevo</SelectItem>
                <SelectItem value="CONTACTED">Contactado</SelectItem>
                <SelectItem value="QUALIFIED">Calificado</SelectItem>
                <SelectItem value="PROPOSAL">Propuesta</SelectItem>
                <SelectItem value="WON">Ganado</SelectItem>
                <SelectItem value="LOST">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Valor estimado (DOP)">
            <Input
              type="number"
              step="0.01"
              min="0"
              {...form.register("estimatedValue")}
            />
          </FormField>
          <FormField label="Cliente vinculado" className="md:col-span-2">
            <Select
              value={form.watch("customerId") ?? ""}
              onValueChange={(v) => form.setValue("customerId", v || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin cliente</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.legalName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Notas" className="md:col-span-2">
            <Textarea {...form.register("notes")} rows={4} />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => router.push("/crm/leads")}>
          <ArrowLeft className="h-4 w-4" />
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {mode === "create" ? "Crear lead" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
