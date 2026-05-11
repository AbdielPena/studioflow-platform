"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { galleryFormSchema, type GalleryFormInput } from "../schemas";
import {
  createGalleryAction,
  updateGalleryAction,
  deleteGalleryAction,
} from "../actions/gallery.actions";

type Props = {
  mode: "create" | "edit";
  id?: string;
  defaultValues?: Partial<GalleryFormInput>;
  customers: Array<{ id: string; legalName: string }>;
  projects: Array<{ id: string; name: string }>;
};

export function GalleryForm({ mode, id, defaultValues, customers, projects }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<GalleryFormInput>({
    resolver: zodResolver(galleryFormSchema),
    defaultValues: { title: "", status: "DRAFT", isPublic: false, ...defaultValues },
  });

  function onSubmit(data: GalleryFormInput) {
    startTransition(async () => {
      const r =
        mode === "create" ? await createGalleryAction(data) : await updateGalleryAction(id!, data);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success(mode === "create" ? "Galería creada" : "Cambios guardados");
      router.push("/gallery");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!id) return;
    startTransition(async () => {
      const r = await deleteGalleryAction(id);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Galería eliminada");
      router.push("/gallery");
      router.refresh();
    });
  }

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información de la galería</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Título" required error={errors.title?.message} className="md:col-span-2">
            <Input {...form.register("title")} placeholder="Boda María & Juan - Selección" />
          </FormField>
          <FormField label="Slug URL" hint="Auto desde título si vacío">
            <Input {...form.register("slug")} placeholder="boda-maria-juan" />
          </FormField>
          <FormField label="URL de imagen de portada">
            <Input type="url" {...form.register("coverUrl")} placeholder="https://..." />
          </FormField>
          <FormField label="Cliente">
            <Select
              value={form.watch("customerId") ?? ""}
              onValueChange={(v) => form.setValue("customerId", v || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin cliente</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.legalName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Proyecto">
            <Select
              value={form.watch("projectId") ?? ""}
              onValueChange={(v) => form.setValue("projectId", v || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin proyecto</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Descripción" className="md:col-span-2">
            <Textarea {...form.register("description")} rows={3} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acceso y publicación</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Estado">
            <Select
              value={form.watch("status")}
              onValueChange={(v) => form.setValue("status", v as GalleryFormInput["status"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Borrador</SelectItem>
                <SelectItem value="PUBLISHED">Publicada</SelectItem>
                <SelectItem value="ARCHIVED">Archivada</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Contraseña" hint="Opcional, vacío = sin contraseña">
            <Input type="password" {...form.register("password")} placeholder="••••••••" />
          </FormField>
          <FormField label="Vence">
            <Input type="date" {...form.register("expiresAt", { valueAsDate: true })} />
          </FormField>
          <Card>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">Galería pública</p>
                <p className="text-xs text-muted-foreground">Aparece en listados públicos</p>
              </div>
              <Switch
                checked={form.watch("isPublic")}
                onCheckedChange={(v) => form.setValue("isPublic", v)}
              />
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => router.push("/gallery")}>
          Cancelar
        </Button>
        <div className="flex items-center gap-2">
          {mode === "edit" && id && (
            <ConfirmDialog
              trigger={
                <Button type="button" variant="outline" disabled={isPending}>
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              }
              title="¿Eliminar galería?"
              description="Soft delete. La galería ya no será accesible públicamente."
              destructive
              onConfirm={handleDelete}
            />
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {mode === "create" ? "Crear galería" : "Guardar"}
          </Button>
        </div>
      </div>
    </form>
  );
}
