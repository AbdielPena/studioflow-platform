import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ConnectionForm } from "@/modules/inventario-link/components/connection-form";

export const metadata = { title: "Nueva conexión" };

export default async function NewConnectionPage() {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.INVENTORY_LINK_CONFIGURE);
  return (
    <div>
      <PageHeader
        title="Nueva conexión a inventario externo"
        breadcrumbs={[
          { label: "Inventario externo", href: "/inventario-link" },
          { label: "Nueva conexión" },
        ]}
      />
      <div className="mx-auto max-w-4xl p-6 lg:p-8">
        <ConnectionForm mode="create" />
      </div>
    </div>
  );
}
