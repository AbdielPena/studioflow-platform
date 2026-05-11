"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import {
  createBankAccountSchema,
  type CreateBankAccountInput,
} from "../schemas/cash.schema";
import { createBankAccountAction } from "../actions/cash.actions";

export function NewBankAccountDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateBankAccountInput>({
    resolver: zodResolver(createBankAccountSchema),
    defaultValues: {
      name: "",
      currency: "DOP",
      isActive: true,
    },
  });

  function onSubmit(data: CreateBankAccountInput) {
    startTransition(async () => {
      const r = await createBankAccountAction(data);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Cuenta bancaria creada");
      setOpen(false);
      form.reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Nueva cuenta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva cuenta bancaria</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Nombre identificador" required>
            <Input {...form.register("name")} placeholder="Cuenta Banreservas Principal" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Banco">
              <Input {...form.register("bankName")} placeholder="Banreservas" />
            </FormField>
            <FormField label="Tipo">
              <Select
                value={form.watch("accountType") ?? ""}
                onValueChange={(v) =>
                  form.setValue("accountType", (v || null) as "CHECKING" | "SAVINGS" | "WALLET" | null)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHECKING">Cuenta corriente</SelectItem>
                  <SelectItem value="SAVINGS">Cuenta de ahorros</SelectItem>
                  <SelectItem value="WALLET">Billetera digital</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <FormField label="Número de cuenta">
            <Input {...form.register("accountNumber")} placeholder="0000-0000-00" />
          </FormField>
          <FormField label="Moneda">
            <Input {...form.register("currency")} maxLength={3} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Crear cuenta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
