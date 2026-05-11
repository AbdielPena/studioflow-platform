import { requireCompany } from "@/packages/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { CompanyForm } from "@/modules/settings/components/company-form";
import { getCompanyService } from "@/modules/settings/services/company.service";

export const metadata = { title: "Empresa" };

export default async function CompanySettingsPage() {
  const ctx = await requireCompany();
  const company = await getCompanyService(ctx.companyId);

  return (
    <div>
      <PageHeader
        title="Empresa"
        description="Datos de tu empresa y configuración fiscal."
        breadcrumbs={[
          { label: "Configuración", href: "/settings" },
          { label: "Empresa" },
        ]}
      />
      <div className="mx-auto max-w-4xl p-6 lg:p-8">
        <CompanyForm
          defaultValues={{
            legalName: company.legalName,
            tradeName: company.tradeName,
            rnc: company.rnc,
            logoUrl: company.logoUrl,
            email: company.email,
            phone: company.phone,
            address: company.address,
            city: company.city,
            country: company.country,
            currency: company.currency,
            timezone: company.timezone,
          }}
        />
      </div>
    </div>
  );
}
