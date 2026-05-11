import Link from "next/link";
import { Plus } from "lucide-react";
import { requireCompany } from "@/packages/auth/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import {
  ConnectionStatusCard,
  EmptyConnectionCard,
} from "@/modules/inventario-link/components/connection-status-card";
import { SyncLogsTable } from "@/modules/inventario-link/components/sync-logs-table";
import { JobsTable } from "@/modules/inventario-link/components/jobs-table";
import {
  listConnectionsService,
  listRecentSyncLogsService,
  listPendingJobsService,
} from "@/modules/inventario-link/services/connection.service";

export const metadata = { title: "Inventario Externo" };

export default async function InventarioLinkPage() {
  const ctx = await requireCompany();
  const [connections, logs, jobs] = await Promise.all([
    listConnectionsService(ctx.companyId),
    listRecentSyncLogsService(ctx.companyId, 50),
    listPendingJobsService(ctx.companyId, 50),
  ]);

  return (
    <div>
      <PageHeader
        title="Inventario Externo"
        description="Conexión con tu software de inventario aparte. Esta plataforma NO mantiene stock internamente."
        breadcrumbs={[{ label: "Inventario externo" }]}
        actions={
          <Button asChild>
            <Link href="/inventario-link/connections/new">
              <Plus className="h-4 w-4" />
              Nueva conexión
            </Link>
          </Button>
        }
      />

      <div className="space-y-6 p-6 lg:p-8">
        <div className="space-y-3">
          {connections.length === 0 ? (
            <EmptyConnectionCard />
          ) : (
            connections.map((c) => <ConnectionStatusCard key={c.id} connection={c} />)
          )}
        </div>

        <Tabs defaultValue="jobs">
          <TabsList>
            <TabsTrigger value="jobs">Jobs pendientes ({jobs.length})</TabsTrigger>
            <TabsTrigger value="logs">Logs de sincronización</TabsTrigger>
          </TabsList>
          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle>Cola de sincronización</CardTitle>
              </CardHeader>
              <CardContent>
                <JobsTable jobs={jobs} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Logs recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <SyncLogsTable logs={logs} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
