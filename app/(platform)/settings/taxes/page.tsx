import { requireCompany } from "@/packages/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { TaxesManager } from "@/modules/settings/components/taxes-manager";
import { listTaxesService } from "@/modules/settings/services/tax.service";

export const metadata = { title: "Impuestos" };

export default async function TaxesPage() {
  const ctx = await requireCompany();
  const taxes = await listTaxesService(ctx.companyId);
  return (
    <div>
      <PageHeader
        title="Impuestos y retenciones"
        description="ITBIS, retenciones ISR/ITBIS, y otros impuestos configurables."
        breadcrumbs={[
          { label: "Configuración", href: "/settings" },
          { label: "Impuestos" },
        ]}
      />
      <div className="p-6 lg:p-8">
        <TaxesManager taxes={taxes} />
      </div>
    </div>
  );
}
