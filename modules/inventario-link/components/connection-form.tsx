"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, Trash2, PlugZap, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  connectionFormSchema,
  type ConnectionFormInput,
} from "../schemas/connection.schema";
import {
  upsertConnectionAction,
  deleteConnectionAction,
  testConnectionAction,
} from "../actions/connection.actions";

export function ConnectionForm({
  mode,
  id,
  defaultValues,
}: {
  mode: "create" | "edit";
  id?: string;
  defaultValues?: Partial<ConnectionFormInput>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; ms: number; error: string | null } | null>(null);

  const form = useForm<ConnectionFormInput>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      name: "",
      baseUrl: "",
      authType: "BEARER",
      timeoutMs: 10000,
      maxRetries: 3,
      manualMode: false,
      isActive: true,
      endpoints: {},
      ...defaultValues,
    },
  });

  function onSubmit(data: ConnectionFormInput) {
    startTransition(async () => {
      const r = await upsertConnectionAction({ ...data, id });
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success(mode === "create" ? "Conexión creada" : "Cambios guardados");
      router.push("/inventario-link");
      router.refresh();
    });
  }

  async function handleTest() {
    if (!id) {
      toast.warning("Guarda primero la conexión para poder probarla");
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    const r = await testConnectionAction(id);
    setIsTesting(false);
    if (!r.ok) {
      toast.error(r.error.message);
      return;
    }
    setTestResult({ ok: r.data.ok, ms: r.data.durationMs, error: r.data.error });
    if (r.data.ok) toast.success(`Conexión OK (${r.data.durationMs}ms)`);
    else toast.error(`Falló: ${r.data.error}`);
  }

  function handleDelete() {
    if (!id) return;
    startTransition(async () => {
      const r = await deleteConnectionAction(id);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Conexión eliminada");
      router.push("/inventario-link");
      router.refresh();
    });
  }

  const errors = form.formState.errors;
  const authType = form.watch("authType");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conexión con inventario externo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Nombre identificador" required>
            <Input {...form.register("name")} placeholder="Sistema principal de inventario" />
          </FormField>
          <FormField label="Tipo de autenticación">
            <Select
              value={authType}
              onValueChange={(v) => form.setValue("authType", v as ConnectionFormInput["authType"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BEARER">Bearer Token</SelectItem>
                <SelectItem value="API_KEY">API Key (header X-API-Key)</SelectItem>
                <SelectItem value="BASIC">Basic Auth</SelectItem>
                <SelectItem value="HMAC">HMAC</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="URL base" required error={errors.baseUrl?.message} className="md:col-span-2">
            <Input
              type="url"
              {...form.register("baseUrl")}
              placeholder="https://inventario.empresa.com/api/v1"
            />
          </FormField>
          {(authType === "BEARER" || authType === "BASIC" || authType === "HMAC") && (
            <FormField label="Token / credenciales" className="md:col-span-2">
              <Input type="password" {...form.register("authToken")} placeholder="••••••••" />
            </FormField>
          )}
          {authType === "API_KEY" && (
            <FormField label="API Key" className="md:col-span-2">
              <Input type="password" {...form.register("apiKey")} placeholder="••••••••" />
            </FormField>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endpoints (opcional, defaults razonables)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Stock query" hint="GET /stock por defecto">
            <Input {...form.register("endpoints.stock")} placeholder="/stock" />
          </FormField>
          <FormField label="Reservar" hint="POST /reserve por defecto">
            <Input {...form.register("endpoints.reserve")} placeholder="/reserve" />
          </FormField>
          <FormField label="Confirmar (commit)">
            <Input {...form.register("endpoints.commit")} placeholder="/commit" />
          </FormField>
          <FormField label="Liberar (release)">
            <Input {...form.register("endpoints.release")} placeholder="/release" />
          </FormField>
          <FormField label="Catálogo de productos" className="md:col-span-2">
            <Input {...form.register("endpoints.products")} placeholder="/products" />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comportamiento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Timeout (ms)">
            <Input type="number" min="1000" {...form.register("timeoutMs")} />
          </FormField>
          <FormField label="Reintentos máximos">
            <Input type="number" min="0" max="10" {...form.register("maxRetries")} />
          </FormField>
          <Card className="md:col-span-2">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">Modo manual</p>
                <p className="text-xs text-muted-foreground">
                  No envía nada automáticamente al externo. Útil mientras configuras o si el sistema está caído.
                </p>
              </div>
              <Switch
                checked={form.watch("manualMode")}
                onCheckedChange={(v) => form.setValue("manualMode", v)}
              />
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">Conexión activa</p>
                <p className="text-xs text-muted-foreground">Si está inactiva, no se usa para nuevas facturas.</p>
              </div>
              <Switch
                checked={form.watch("isActive")}
                onCheckedChange={(v) => form.setValue("isActive", v)}
              />
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            {testResult.ok ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
            <div className="flex-1 text-sm">
              {testResult.ok ? (
                <span>Conexión exitosa en <strong>{testResult.ms}ms</strong></span>
              ) : (
                <span className="text-destructive">{testResult.error}</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={() => router.push("/inventario-link")}>
          Cancelar
        </Button>
        <div className="flex items-center gap-2">
          {mode === "edit" && id && (
            <>
              <Button type="button" variant="outline" onClick={handleTest} disabled={isTesting}>
                {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
                Probar conexión
              </Button>
              <ConfirmDialog
                trigger={
                  <Button type="button" variant="outline" disabled={isPending}>
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                }
                title="¿Eliminar conexión?"
                description="Soft delete. Las facturas pendientes de sincronización quedarán sin conexión activa."
                destructive
                onConfirm={handleDelete}
              />
            </>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {mode === "create" ? "Crear conexión" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </form>
  );
}
