import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { NcfSequenceForm } from "@/modules/settings/components/ncf-form";
import { listBranchesService } from "@/modules/settings/services/branch.service";

export const metadata = { title: "Nueva secuencia NCF" };

export default async function NewNcfPage() {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.FACTURACION_NCF_MANAGE);
  const branches = await listBranchesService(ctx.companyId);
  return (
    <div>
      <PageHeader
        title="Nueva secuencia NCF"
        breadcrumbs={[
          { label: "Configuración", href: "/settings" },
          { label: "NCF", href: "/settings/ncf" },
          { label: "Nueva" },
        ]}
      />
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        <NcfSequenceForm branches={branches} />
      </div>
    </div>
  );
}
