import { Sparkles, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
  features: string[];
};

export function ModulePlaceholder({ icon: Icon, title, description, phase, features }: Props) {
  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            <Badge variant="info">{phase}</Badge>
          </div>

          <div className="rounded-xl border bg-muted/30 p-6">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Funcionalidades planificadas</p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
