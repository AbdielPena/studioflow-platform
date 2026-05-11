import { notFound } from "next/navigation";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { BranchForm } from "@/modules/settings/components/branch-form";
import { getBranchService } from "@/modules/settings/services/branch.service";
import { isAppError } from "@/packages/lib/errors";

export const metadata = { title: "Editar sucursal" };

export default async function EditBranchPage({ params }: { params: { id: string } }) {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.PLATFORM_SETTINGS_MANAGE);

  let branch;
  try {
    branch = await getBranchService(ctx.companyId, params.id);
  } catch (err) {
    if (isAppError(err) && err.code === "NOT_FOUND") notFound();
    throw err;
  }

  return (
    <div>
      <PageHeader
        title={branch.name}
        description={branch.code}
        breadcrumbs={[
          { label: "Configuración", href: "/settings" },
          { label: "Sucursales", href: "/settings/branches" },
          { label: branch.name },
        ]}
      />
      <div className="mx-auto max-w-3xl p-6 lg:p-8">
        <BranchForm
          mode="edit"
          id={branch.id}
          defaultValues={{
            code: branch.code,
            name: branch.name,
            address: branch.address,
            phone: branch.phone,
            isMain: branch.isMain,
            isActive: branch.isActive,
          }}
        />
      </div>
    </div>
  );
}
