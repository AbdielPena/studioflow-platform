import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { listCustomersService } from "@/modules/customers/services/customer.service";
import { CustomersTable } from "@/modules/customers/components/customers-table";

export const metadata = { title: "Clientes" };

export default async function CustomersListPage() {
  const ctx = await requireCompany();
  const customers = await listCustomersService(ctx.companyId);

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gestiona el catálogo de clientes para facturación, CRM y galerías."
        breadcrumbs={[
          { label: "Facturación", href: "/facturacion" },
          { label: "Clientes" },
        ]}
        actions={
          <Button asChild>
            <Link href="/facturacion/customers/new">
              <Plus className="h-4 w-4" />
              Nuevo cliente
            </Link>
          </Button>
        }
      />

      <div className="p-6 lg:p-8">
        {customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin clientes todavía"
            description="Crea tu primer cliente para empezar a emitir cotizaciones y facturas."
            actionLabel="Crear cliente"
            actionHref="/facturacion/customers/new"
          />
        ) : (
          <CustomersTable customers={customers} />
        )}
      </div>
    </div>
  );
}
