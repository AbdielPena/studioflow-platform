import { notFound } from "next/navigation";
import Link from "next/link";
import { requireCompany } from "@/packages/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { PrintButton } from "@/components/shared/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { getDeliveryService } from "@/modules/facturacion/services/delivery.service";
import { isAppError } from "@/packages/lib/errors";
import { DeliveryStatusActions } from "@/modules/facturacion/components/delivery-status-actions";

export const metadata = { title: "Conduce" };

export default async function DeliveryPage({ params }: { params: { id: string } }) {
  const ctx = await requireCompany();

  let delivery;
  try {
    delivery = await getDeliveryService(ctx.companyId, params.id);
  } catch (err) {
    if (isAppError(err) && err.code === "NOT_FOUND") notFound();
    throw err;
  }

  return (
    <div>
      <PageHeader
        title={`Conduce ${delivery.number}`}
        breadcrumbs={[
          { label: "Facturación", href: "/facturacion" },
          { label: "Conduces", href: "/facturacion/deliveries" },
          { label: delivery.number },
        ]}
        actions={<PrintButton href={`/print/delivery/${delivery.id}`} />}
      />
      <div className="mx-auto max-w-5xl space-y-6 p-6 lg:p-8">
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <div className="flex items-center gap-3">
                <p className="font-mono text-lg font-semibold">{delivery.number}</p>
                <StatusBadge status={delivery.status} />
                {delivery.inventorySyncStatusSnapshot && (
                  <StatusBadge status={delivery.inventorySyncStatusSnapshot} />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {delivery.invoice.customer.legalName} ·{" "}
                <Link href={`/facturacion/invoices/${delivery.invoice.id}`} className="hover:underline">
                  {delivery.invoice.number}
                </Link>
              </p>
            </div>
            <DeliveryStatusActions deliveryId={delivery.id} currentStatus={delivery.status} />
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Logística</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chofer</span>
                <span>{delivery.driverName ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehículo</span>
                <span className="font-mono">{delivery.vehiclePlate ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ruta</span>
                <span>{delivery.route ?? "—"}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Fechas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creado</span>
                <span>{new Date(delivery.createdAt).toLocaleString("es-DO")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Despachado</span>
                <span>
                  {delivery.dispatchedAt
                    ? new Date(delivery.dispatchedAt).toLocaleString("es-DO")
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entregado</span>
                <span>
                  {delivery.deliveredAt
                    ? new Date(delivery.deliveredAt).toLocaleString("es-DO")
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Firmado</span>
                <span>
                  {delivery.signedAt ? new Date(delivery.signedAt).toLocaleString("es-DO") : "—"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Productos despachados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {delivery.items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>{it.description}</TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(it.quantity).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {delivery.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{delivery.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
