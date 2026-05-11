"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormField } from "@/components/shared/form-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { taxConfigFormSchema, type TaxConfigFormInput } from "../schemas";
import { upsertTaxAction, deleteTaxAction } from "../actions/settings.actions";
import type { TaxConfig } from "@prisma/client";

export function TaxesManager({ taxes }: { taxes: TaxConfig[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<TaxConfigFormInput>({
    resolver: zodResolver(taxConfigFormSchema),
    defaultValues: { key: "", name: "", rate: 0, isWithholding: false, isActive: true },
  });

  function onSubmit(data: TaxConfigFormInput) {
    startTransition(async () => {
      const r = await upsertTaxAction(data);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Impuesto guardado");
      setOpen(false);
      form.reset();
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const r = await deleteTaxAction(id);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Impuesto eliminado");
      router.refresh();
    });
  }

  const columns: Column<TaxConfig>[] = [
    {
      key: "key",
      header: "Código",
      searchAccessor: (t) => `${t.key} ${t.name}`,
      cell: (t) => <span className="font-mono text-xs font-medium">{t.key}</span>,
    },
    { key: "name", header: "Nombre", cell: (t) => t.name },
    {
      key: "rate",
      header: "Tasa",
      align: "right",
      cell: (t) => `${(Number(t.rate) * 100).toFixed(2)}%`,
    },
    {
      key: "kind",
      header: "Tipo",
      cell: (t) => (
        <span className="text-xs">{t.isWithholding ? "Retención" : "Impuesto"}</span>
      ),
    },
    {
      key: "active",
      header: "Estado",
      cell: (t) => <StatusBadge status={t.isActive ? "ACTIVE" : "INACTIVE"} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (t) => (
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="icon" disabled={isPending}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          }
          title={`¿Eliminar "${t.key}"?`}
          destructive
          onConfirm={() => handleDelete(t.id)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Nuevo impuesto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar impuesto</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField label="Código" required hint="UPPER_SNAKE">
                <Input {...form.register("key")} placeholder="ITBIS_18" />
              </FormField>
              <FormField label="Nombre" required>
                <Input {...form.register("name")} placeholder="ITBIS 18%" />
              </FormField>
              <FormField label="Tasa" required hint="Decimal: 0.18 = 18%">
                <Input type="number" step="0.0001" min="0" max="1" {...form.register("rate")} />
              </FormField>
              <Card>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-medium">¿Es retención?</p>
                    <p className="text-xs text-muted-foreground">Resta del total, no suma</p>
                  </div>
                  <Switch
                    checked={form.watch("isWithholding")}
                    onCheckedChange={(v) => form.setValue("isWithholding", v)}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <p className="text-sm font-medium">Activo</p>
                  <Switch
                    checked={form.watch("isActive")}
                    onCheckedChange={(v) => form.setValue("isActive", v)}
                  />
                </CardContent>
              </Card>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar impuesto
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Impuestos configurados</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={taxes}
            columns={columns}
            rowKey={(t) => t.id}
            searchable={false}
            emptyMessage="No hay impuestos configurados"
          />
        </CardContent>
      </Card>
    </div>
  );
}
