import Link from "next/link";
import { Plug, CheckCircle2, AlertTriangle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ExternalInventoryConnection } from "@prisma/client";

export function ConnectionStatusCard({ connection }: { connection: ExternalInventoryConnection }) {
  const isHealthy = connection.lastHealthOk === true;
  const checked = connection.lastHealthCheckAt;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              isHealthy ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
            }`}
          >
            {isHealthy ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{connection.name}</p>
              {connection.manualMode && (
                <Badge variant="warning" className="text-[10px]">
                  Modo manual
                </Badge>
              )}
              {!connection.isActive && (
                <Badge variant="secondary" className="text-[10px]">
                  Inactiva
                </Badge>
              )}
            </div>
            <p className="font-mono text-xs text-muted-foreground">{connection.baseUrl}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {checked
                ? `Última verificación: ${new Date(checked).toLocaleString("es-DO")}`
                : "Sin verificar aún"}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/inventario-link/connections/${connection.id}`}>
            <Pencil className="h-4 w-4" />
            Configurar
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function EmptyConnectionCard() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
          <Plug className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">Aún no has conectado tu inventario externo</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Esta plataforma no maneja stock internamente. Conecta tu software de inventario
            para validar existencia y descontar al confirmar facturas.
          </p>
        </div>
        <Button asChild>
          <Link href="/inventario-link/connections/new">Configurar conexión</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
