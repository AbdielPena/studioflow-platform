"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Truck, Check, X, Pen } from "lucide-react";
import { DeliveryStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { setDeliveryStatusAction } from "../actions/delivery.actions";

type Props = {
  deliveryId: string;
  currentStatus: DeliveryStatus;
};

export function DeliveryStatusActions({ deliveryId, currentStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setStatus(next: DeliveryStatus) {
    startTransition(async () => {
      const r = await setDeliveryStatusAction(deliveryId, next);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Estado actualizado");
      router.refresh();
    });
  }

  const isFinal = currentStatus === "SIGNED" || currentStatus === "CANCELLED";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {currentStatus === "PENDING" && (
        <Button onClick={() => setStatus(DeliveryStatus.IN_TRANSIT)} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
          Despachar
        </Button>
      )}
      {currentStatus === "IN_TRANSIT" && (
        <Button onClick={() => setStatus(DeliveryStatus.DELIVERED)} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Marcar entregado
        </Button>
      )}
      {currentStatus === "DELIVERED" && (
        <Button onClick={() => setStatus(DeliveryStatus.SIGNED)} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pen className="h-4 w-4" />}
          Confirmar firma
        </Button>
      )}
      {!isFinal && (
        <Button
          variant="outline"
          onClick={() => setStatus(DeliveryStatus.CANCELLED)}
          disabled={isPending}
        >
          <X className="h-4 w-4" />
          Cancelar
        </Button>
      )}
    </div>
  );
}
