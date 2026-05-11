import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { BranchForm } from "@/modules/settings/components/branch-form";

export const metadata = { title: "Nueva sucursal" };

export default async function NewBranchPage() {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.PLATFORM_SETTINGS_MANAGE);
  return (
    <div>
      <PageHeader
        title="Nueva sucursal"
        breadcrumbs={[
          { label: "Configuración", href: "/settings" },
          { label: "Sucursales", href: "/settings/branches" },
          { label: "Nueva" },
        ]}
      />
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        <BranchForm mode="create" />
      </div>
    </div>
  );
}
