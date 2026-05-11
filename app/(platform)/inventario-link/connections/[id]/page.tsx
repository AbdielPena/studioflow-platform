import { notFound } from "next/navigation";
import { requireCompany } from "@/packages/auth/session";
import { requirePermission } from "@/packages/auth/rbac";
import { PERMISSIONS } from "@/packages/lib/permissions";
import { PageHeader } from "@/components/shared/page-header";
import { ConnectionForm } from "@/modules/inventario-link/components/connection-form";
import { getConnectionService } from "@/modules/inventario-link/services/connection.service";
import { isAppError } from "@/packages/lib/errors";

export const metadata = { title: "Editar conexión" };

export default async function EditConnectionPage({ params }: { params: { id: string } }) {
  const ctx = await requireCompany();
  requirePermission(ctx, PERMISSIONS.INVENTORY_LINK_CONFIGURE);

  let conn;
  try {
    conn = await getConnectionService(ctx.companyId, params.id);
  } catch (err) {
    if (isAppError(err) && err.code === "NOT_FOUND") notFound();
    throw err;
  }

  return (
    <div>
      <PageHeader
        title={conn.name}
        description={conn.baseUrl}
        breadcrumbs={[
          { label: "Inventario externo", href: "/inventario-link" },
          { label: conn.name },
        ]}
      />
      <div className="mx-auto max-w-4xl p-6 lg:p-8">
        <ConnectionForm
          mode="edit"
          id={conn.id}
          defaultValues={{
            name: conn.name,
            baseUrl: conn.baseUrl,
            authType: conn.authType as "BEARER" | "BASIC" | "API_KEY" | "HMAC",
            authToken: conn.authToken,
            apiKey: conn.apiKey,
            customHeaders: (conn.customHeaders as Record<string, string> | null) ?? null,
            endpoints: (conn.endpoints as Record<string, string>) ?? {},
            timeoutMs: conn.timeoutMs,
            maxRetries: conn.maxRetries,
            manualMode: conn.manualMode,
            isActive: conn.isActive,
          }}
        />
      </div>
    </div>
  );
}
