"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Mail, Phone, MoreVertical } from "lucide-react";
import { LeadStage, type CrmLead, type Customer } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/packages/lib/decimal";
import { setLeadStageAction, deleteLeadAction } from "../actions/crm.actions";

type Lead = CrmLead & { customer: Customer | null };

const STAGES: { key: LeadStage; label: string; tone: string }[] = [
  { key: "NEW", label: "Nuevo", tone: "bg-info/10 text-info" },
  { key: "CONTACTED", label: "Contactado", tone: "bg-warning/10 text-warning" },
  { key: "QUALIFIED", label: "Calificado", tone: "bg-primary/10 text-primary" },
  { key: "PROPOSAL", label: "Propuesta", tone: "bg-primary/10 text-primary" },
  { key: "WON", label: "Ganado", tone: "bg-success/10 text-success" },
  { key: "LOST", label: "Perdido", tone: "bg-destructive/10 text-destructive" },
];

export function LeadsKanban({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function moveLead(leadId: string, stage: LeadStage) {
    startTransition(async () => {
      const r = await setLeadStageAction(leadId, stage);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Lead movido");
      router.refresh();
    });
  }

  function deleteLead(leadId: string) {
    if (!confirm("¿Eliminar este lead?")) return;
    startTransition(async () => {
      const r = await deleteLeadAction(leadId);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Lead eliminado");
      router.refresh();
    });
  }

  return (
    <div className="grid h-full gap-3 overflow-x-auto pb-2 lg:grid-cols-6">
      {STAGES.map((s) => {
        const stageLeads = leads.filter((l) => l.stage === s.key);
        const total = stageLeads.reduce(
          (acc, l) => acc + (l.estimatedValue ? Number(l.estimatedValue) : 0),
          0,
        );
        return (
          <div key={s.key} className="flex min-w-[260px] flex-col rounded-2xl border bg-card/30 p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`flex h-6 items-center rounded-full px-2 text-xs font-medium ${s.tone}`}>
                  {s.label}
                </span>
                <span className="text-xs text-muted-foreground">{stageLeads.length}</span>
              </div>
              {total > 0 && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  {formatCurrency(total)}
                </span>
              )}
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
              {stageLeads.length === 0 ? (
                <p className="rounded-xl border border-dashed py-6 text-center text-xs text-muted-foreground">
                  Sin leads
                </p>
              ) : (
                stageLeads.map((l) => (
                  <div
                    key={l.id}
                    className="group rounded-xl border bg-card p-3 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <Link
                        href={`/crm/leads/${l.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {l.name}
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {STAGES.filter((x) => x.key !== l.stage).map((x) => (
                            <DropdownMenuItem
                              key={x.key}
                              onClick={() => moveLead(l.id, x.key)}
                              disabled={isPending}
                            >
                              Mover a {x.label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuItem
                            onClick={() => deleteLead(l.id)}
                            disabled={isPending}
                            className="text-destructive"
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {l.estimatedValue && (
                      <p className="mb-2 font-mono text-xs font-medium text-primary">
                        {formatCurrency(l.estimatedValue.toString())}
                      </p>
                    )}
                    {l.source && (
                      <Badge variant="secondary" className="mb-2 text-[10px]">
                        {l.source}
                      </Badge>
                    )}
                    <div className="space-y-0.5 text-[11px] text-muted-foreground">
                      {l.email && (
                        <p className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" />
                          {l.email}
                        </p>
                      )}
                      {l.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3" />
                          {l.phone}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
