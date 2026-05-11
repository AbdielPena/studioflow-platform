import Link from "next/link";
import { Plus, Receipt, AlertTriangle } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { listNcfSequencesService } from "@/modules/settings/services/ncf.service";
import { NCF_TYPE_LABELS, formatNcf } from "@/packages/lib/fiscal";
import type { NcfSequence, Branch } from "@prisma/client";

export const metadata = { title: "NCF" };

type Row = NcfSequence & { branch: Branch | null };

export default async function NcfPage() {
  const ctx = await requireCompany();
  const sequences = (await listNcfSequencesService(ctx.companyId)) as Row[];

  const columns: Column<Row>[] = [
    {
      key: "type",
      header: "Tipo",
      searchAccessor: (s) => `${s.type} ${s.prefix} ${NCF_TYPE_LABELS[s.type] ?? ""}`,
      cell: (s) => (
        <div className="flex flex-col">
          <span className="font-mono text-sm font-medium">{s.type}</span>
          <span className="text-xs text-muted-foreground">{NCF_TYPE_LABELS[s.type] ?? ""}</span>
        </div>
      ),
    },
    {
      key: "range",
      header: "Rango",
      cell: (s) => (
        <span className="font-mono text-xs">
          {formatNcf(s.prefix, s.rangeFrom)} → {formatNcf(s.prefix, s.rangeTo)}
        </span>
      ),
    },
    {
      key: "current",
      header: "Emitidos",
      align: "right",
      cell: (s) => {
        const emitted = Math.max(0, s.currentValue - s.rangeFrom + 1);
        const total = s.rangeTo - s.rangeFrom + 1;
        const pct = (emitted / total) * 100;
        return (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs">
              {emitted} / {total}
            </span>
            {pct >= 80 && (
              <Badge variant="warning" className="text-[10px]">
                <AlertTriangle className="h-3 w-3" /> {pct.toFixed(0)}%
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "branch",
      header: "Sucursal",
      cell: (s) => (
        <span className="text-xs">{s.branch?.name ?? "Todas"}</span>
      ),
    },
    {
      key: "expires",
      header: "Vence",
      cell: (s) => (
        <span className="text-xs">
          {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString("es-DO") : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      cell: (s) => <StatusBadge status={s.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Secuencias NCF"
        description="Comprobantes Fiscales — República Dominicana (B01–B17)."
        breadcrumbs={[
          { label: "Configuración", href: "/settings" },
          { label: "NCF" },
        ]}
        actions={
          <Button asChild>
            <Link href="/settings/ncf/new">
              <Plus className="h-4 w-4" />
              Nueva secuencia
            </Link>
          </Button>
        }
      />
      <div className="p-6 lg:p-8">
        {sequences.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Sin secuencias NCF"
            description="Crea una secuencia para empezar a emitir comprobantes fiscales."
            actionLabel="Crear secuencia"
            actionHref="/settings/ncf/new"
          />
        ) : (
          <DataTable
            data={sequences}
            columns={columns}
            rowKey={(s) => s.id}
            searchPlaceholder="Buscar tipo NCF..."
          />
        )}
      </div>
    </div>
  );
}
