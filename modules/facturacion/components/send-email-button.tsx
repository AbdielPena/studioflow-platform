"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Mail, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField } from "@/components/shared/form-field";
import { sendInvoiceByEmailAction } from "../actions/email.actions";

type Props = {
  invoiceId: string;
  defaultEmail: string | null;
};

export function SendInvoiceByEmailButton({ invoiceId, defaultEmail }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [isPending, startTransition] = useTransition();

  function onSend() {
    if (!email.trim()) {
      toast.error("Ingresa un correo destino");
      return;
    }
    startTransition(async () => {
      const r = await sendInvoiceByEmailAction({ invoiceId, to: email.trim() });
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Factura enviada");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Mail className="h-4 w-4" />
          Enviar por correo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar factura por correo</DialogTitle>
        </DialogHeader>
        <FormField label="Correo destino" required>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@correo.com"
          />
        </FormField>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={onSend} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
