import { Badge } from "@/components/ui/badge";

const STATUS_TONE: Record<string, "default" | "success" | "warning" | "destructive" | "info" | "secondary"> = {
  // Invoice
  DRAFT: "secondary",
  ISSUED: "info",
  PAID: "success",
  PARTIALLY_PAID: "warning",
  OVERDUE: "destructive",
  VOIDED: "destructive",
  CANCELLED: "destructive",

  // Quote
  SENT: "info",
  APPROVED: "success",
  REJECTED: "destructive",
  EXPIRED: "destructive",
  CONVERTED: "success",

  // Delivery
  PENDING: "warning",
  IN_TRANSIT: "info",
  DELIVERED: "success",
  SIGNED: "success",

  // Generic
  ACTIVE: "success",
  INACTIVE: "secondary",
  PAUSED: "warning",
  EXHAUSTED: "destructive",

  // Inventory sync
  NOT_REQUIRED: "secondary",
  SYNCING: "info",
  SYNCED: "success",
  FAILED: "destructive",
  REVERSED: "warning",

  // Product sync
  UNLINKED: "secondary",
  LINKED: "success",
  ERROR: "destructive",

  // Job status
  QUEUED: "secondary",
  RUNNING: "info",
  SUCCEEDED: "success",
  RETRYING: "warning",
  DEAD_LETTER: "destructive",

  // Account
  OPEN: "info",
  WRITTEN_OFF: "secondary",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  ISSUED: "Emitida",
  PAID: "Pagada",
  PARTIALLY_PAID: "Pago parcial",
  OVERDUE: "Vencida",
  VOIDED: "Anulada",
  CANCELLED: "Cancelada",
  SENT: "Enviada",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  EXPIRED: "Vencida",
  CONVERTED: "Convertida",
  PENDING: "Pendiente",
  IN_TRANSIT: "En tránsito",
  DELIVERED: "Entregado",
  SIGNED: "Firmado",
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  PAUSED: "Pausado",
  EXHAUSTED: "Agotado",
  NOT_REQUIRED: "N/A",
  SYNCING: "Sincronizando",
  SYNCED: "Sincronizado",
  FAILED: "Fallido",
  REVERSED: "Revertido",
  UNLINKED: "Sin vincular",
  LINKED: "Vinculado",
  ERROR: "Error",
  QUEUED: "En cola",
  RUNNING: "Ejecutando",
  SUCCEEDED: "Exitoso",
  RETRYING: "Reintentando",
  DEAD_LETTER: "Bandeja muerta",
  OPEN: "Abierta",
  WRITTEN_OFF: "Castigada",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone = STATUS_TONE[status] ?? "default";
  const display = label ?? STATUS_LABEL[status] ?? status;
  return <Badge variant={tone}>{display}</Badge>;
}
