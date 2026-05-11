"use client";

import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import type { ExternalInventorySyncLog, ExternalInventoryConnection } from "@prisma/client";

type Row = ExternalInventorySyncLog & { connection: ExternalInventoryConnection };

const JOB_TYPE_LABEL: Record<string, string> = {
  RESERVE: "Reservar",
  COMMIT: "Confirmar",
  RELEASE: "Liberar",
  STOCK_QUERY: "Consulta stock",
  PRODUCT_SYNC: "Sync producto",
  ADJUSTMENT: "Ajuste",
};

export function SyncLogsTable({ logs }: { logs: Row[] }) {
  const columns: Column<Row>[] = [
    {
      key: "createdAt",
      header: "Fecha",
      cell: (l) => (
        <span className="font-mono text-xs">
          {new Date(l.createdAt).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "medium" })}
        </span>
      ),
    },
    {
      key: "type",
      header: "Operación",
      cell: (l) => (
        <Badge variant="secondary">{JOB_TYPE_LABEL[l.jobType] ?? l.jobType}</Badge>
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (l) => <StatusBadge status={l.status} />,
    },
    {
      key: "duration",
      header: "Duración",
      align: "right",
      cell: (l) => (
        <span className="font-mono text-xs">
          {l.durationMs ? `${l.durationMs}ms` : "—"}
        </span>
      ),
    },
    {
      key: "invoice",
      header: "Factura",
      cell: (l) => (
        <span className="font-mono text-xs text-muted-foreground">
          {l.invoiceId ?? "—"}
        </span>
      ),
    },
    {
      key: "error",
      header: "Error",
      cell: (l) =>
        l.errorMessage ? (
          <span className="text-xs text-destructive line-clamp-1" title={l.errorMessage}>
            {l.errorMessage}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <DataTable
      data={logs}
      columns={columns}
      rowKey={(l) => l.id}
      searchable={false}
      emptyMessage="Sin logs de sincronización todavía."
    />
  );
}
