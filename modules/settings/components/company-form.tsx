"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/shared/form-field";
import { companyFormSchema, type CompanyFormInput } from "../schemas";
import { updateCompanyAction } from "../actions/settings.actions";

export function CompanyForm({ defaultValues }: { defaultValues: CompanyFormInput }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CompanyFormInput>({
    resolver: zodResolver(companyFormSchema),
    defaultValues,
  });

  function onSubmit(data: CompanyFormInput) {
    startTransition(async () => {
      const r = await updateCompanyAction(data);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Empresa actualizada");
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identificación</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Razón social" required className="md:col-span-2">
            <Input {...form.register("legalName")} />
          </FormField>
          <FormField label="Nombre comercial">
            <Input {...form.register("tradeName")} />
          </FormField>
          <FormField label="RNC">
            <Input {...form.register("rnc")} placeholder="131000000" />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Correo">
            <Input type="email" {...form.register("email")} />
          </FormField>
          <FormField label="Teléfono">
            <Input {...form.register("phone")} />
          </FormField>
          <FormField label="Dirección" className="md:col-span-2">
            <Textarea {...form.register("address")} rows={2} />
          </FormField>
          <FormField label="Ciudad">
            <Input {...form.register("city")} />
          </FormField>
          <FormField label="País" hint="ISO 2 letras">
            <Input {...form.register("country")} maxLength={2} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Moneda y zona horaria</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Moneda" hint="ISO 3 letras">
            <Input {...form.register("currency")} maxLength={3} />
          </FormField>
          <FormField label="Zona horaria">
            <Input {...form.register("timezone")} />
          </FormField>
          <FormField label="Logo URL" className="md:col-span-2">
            <Input type="url" {...form.register("logoUrl")} placeholder="https://..." />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
