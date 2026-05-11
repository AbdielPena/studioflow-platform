"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, DoorOpen, DoorClosed, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  openCashSessionSchema,
  closeCashSessionSchema,
  createCashRegisterSchema,
  type OpenCashSessionInput,
  type CloseCashSessionInput,
  type CreateCashRegisterInput,
} from "../schemas/cash.schema";
import {
  openCashSessionAction,
  closeCashSessionAction,
  createCashRegisterAction,
} from "../actions/cash.actions";

export function OpenCashSessionDialog({
  registers,
}: {
  registers: Array<{ id: string; name: string; hasOpenSession: boolean }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<OpenCashSessionInput>({
    resolver: zodResolver(openCashSessionSchema),
    defaultValues: { cashRegisterId: "", openingAmount: 0 },
  });

  function onSubmit(data: OpenCashSessionInput) {
    startTransition(async () => {
      const r = await openCashSessionAction(data);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Caja abierta");
      setOpen(false);
      form.reset();
      router.refresh();
    });
  }

  const available = registers.filter((r) => !r.hasOpenSession);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={available.length === 0}>
          <DoorOpen className="h-4 w-4" />
          Abrir caja
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir sesión de caja</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Caja registradora" required>
            <Select
              value={form.watch("cashRegisterId")}
              onValueChange={(v) => form.setValue("cashRegisterId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {available.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Monto inicial (efectivo)" required hint="Fondo de caja al abrir">
            <Input
              type="number"
              step="0.01"
              min="0"
              {...form.register("openingAmount")}
              autoFocus
            />
          </FormField>
          <FormField label="Notas">
            <Textarea {...form.register("notes")} rows={2} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Abrir caja
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CloseCashSessionDialog({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CloseCashSessionInput>({
    resolver: zodResolver(closeCashSessionSchema),
    defaultValues: { sessionId, closingAmount: 0 },
  });

  function onSubmit(data: CloseCashSessionInput) {
    startTransition(async () => {
      const r = await closeCashSessionAction(data);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Caja cerrada");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <DoorClosed className="h-4 w-4" />
          Cerrar caja
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cerrar sesión de caja</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Monto contado (arqueo)" required hint="Total real en efectivo">
            <Input
              type="number"
              step="0.01"
              min="0"
              {...form.register("closingAmount")}
              autoFocus
            />
          </FormField>
          <FormField label="Notas">
            <Textarea
              {...form.register("notes")}
              rows={3}
              placeholder="Diferencias, observaciones..."
            />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Cerrar caja
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreateCashRegisterDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateCashRegisterInput>({
    resolver: zodResolver(createCashRegisterSchema),
    defaultValues: { name: "" },
  });

  function onSubmit(data: CreateCashRegisterInput) {
    startTransition(async () => {
      const r = await createCashRegisterAction(data);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Caja creada");
      setOpen(false);
      form.reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4" />
          Nueva caja
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear caja registradora</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Nombre" required>
            <Input {...form.register("name")} placeholder="Caja Principal" autoFocus />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
