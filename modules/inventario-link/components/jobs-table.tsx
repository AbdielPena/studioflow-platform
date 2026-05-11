"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { runJobAction } from "../actions/connection.actions";
import type { PendingInventorySyncJob, ExternalInventoryConnection } from "@prisma/client";

type Row = PendingInventorySyncJob & { connection: ExternalInventoryConnection };

const JOB_TYPE_LABEL: Record<string, string> = {
  RESERVE: "Reservar",
  COMMIT: "Confirmar",
  RELEASE: "Liberar",
  STOCK_QUERY: "Consulta stock",
  PRODUCT_SYNC: "Sync producto",
  ADJUSTMENT: "Ajuste",
};

export function JobsTable({ jobs }: { jobs: Row[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRetry(jobId: string) {
    startTransition(async () => {
      const r = await runJobAction(jobId);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Job re-ejecutado");
      router.refresh();
    });
  }

  const columns: Column<Row>[] = [
    {
      key: "createdAt",
      header: "Creado",
      cell: (j) => (
        <span className="font-mono text-xs">
          {new Date(j.createdAt).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" })}
        </span>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      cell: (j) => <Badge variant="secondary">{JOB_TYPE_LABEL[j.jobType] ?? j.jobType}</Badge>,
    },
    {
      key: "status",
      header: "Estado",
      cell: (j) => <StatusBadge status={j.status} />,
    },
    {
      key: "attempts",
      header: "Intentos",
      align: "center",
      cell: (j) => (
        <span className="text-xs">
          {j.attempts}/{j.maxAttempts}
        </span>
      ),
    },
    {
      key: "invoice",
      header: "Factura",
      cell: (j) => (
        <span className="font-mono text-xs text-muted-foreground">{j.invoiceId ?? "—"}</span>
      ),
    },
    {
      key: "error",
      header: "Último error",
      cell: (j) =>
        j.lastError ? (
          <span className="text-xs text-destructive line-clamp-1" title={j.lastError}>
            {j.lastError}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (j) =>
        ["QUEUED", "RETRYING", "FAILED"].includes(j.status) ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRetry(j.id)}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Ejecutar
          </Button>
        ) : null,
    },
  ];

  return (
    <DataTable
      data={jobs}
      columns={columns}
      rowKey={(j) => j.id}
      searchable={false}
      emptyMessage="No hay jobs pendientes. ✓"
    />
  );
}
