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
import { ncfSequenceFormSchema, type NcfSequenceFormInput } from "../schemas";
import { createNcfSequenceAction } from "../actions/settings.actions";
import { NCF_TYPE_LABELS } from "@/packages/lib/fiscal";

export function NcfSequenceForm({
  branches,
}: {
  branches: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<NcfSequenceFormInput>({
    resolver: zodResolver(ncfSequenceFormSchema),
    defaultValues: { type: "B02", rangeFrom: 1, rangeTo: 1000 },
  });

  function onSubmit(data: NcfSequenceFormInput) {
    startTransition(async () => {
      const r = await createNcfSequenceAction(data);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Secuencia NCF creada");
      router.push("/settings/ncf");
      router.refresh();
    });
  }

  const errors = form.formState.errors;
  const type = form.watch("type");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nueva secuencia NCF</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Tipo de comprobante" required>
            <Select
              value={type}
              onValueChange={(v) => form.setValue("type", v as NcfSequenceFormInput["type"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NCF_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {k} — {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Sucursal" hint="Opcional, deja vacío para todas">
            <Select
              value={form.watch("branchId") ?? "ALL"}
              onValueChange={(v) => form.setValue("branchId", v === "ALL" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las sucursales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las sucursales</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Desde" required>
            <Input type="number" min="1" {...form.register("rangeFrom")} />
          </FormField>
          <FormField label="Hasta" required error={errors.rangeTo?.message}>
            <Input type="number" min="1" {...form.register("rangeTo")} />
          </FormField>
          <FormField label="Fecha de vencimiento" hint="Opcional">
            <Input type="date" {...form.register("expiresAt", { valueAsDate: true })} />
          </FormField>
          <FormField label="Notas" className="md:col-span-2">
            <Textarea {...form.register("notes")} rows={2} />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.push("/settings/ncf")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Crear secuencia
        </Button>
      </div>
    </form>
  );
}
