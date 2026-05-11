import { notFound } from "next/navigation";
import Link from "next/link";
import { requireCompany } from "@/packages/auth/session";
import { prisma } from "@/packages/db";
import { getDeliveryService } from "@/modules/facturacion/services/delivery.service";
import { isAppError } from "@/packages/lib/errors";
import { PrintToolbar } from "@/components/print/print-toolbar";

export const metadata = { title: "Imprimir conduce" };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  IN_TRANSIT: "En tránsito",
  DELIVERED: "Entregado",
  SIGNED: "Firmado",
  CANCELLED: "Cancelado",
};

export default async function PrintDeliveryPage({ params }: { params: { id: string } }) {
  const ctx = await requireCompany();

  let delivery;
  try {
    delivery = await getDeliveryService(ctx.companyId, params.id);
  } catch (err) {
    if (isAppError(err) && err.code === "NOT_FOUND") notFound();
    throw err;
  }

  const company = await prisma.company.findUniqueOrThrow({
    where: { id: ctx.companyId },
  });

  return (
    <>
      <PrintToolbar backHref={`/facturacion/deliveries/${delivery.id}`} />
      <div className="print-page">
        <header className="doc-head">
          <div>
            <p className="brand">{company.tradeName ?? company.legalName}</p>
            <p className="meta">
              {company.rnc && (
                <>
                  RNC {company.rnc}
                  <br />
                </>
              )}
              {company.address}
              {company.city && `, ${company.city}`}
            </p>
          </div>
          <div className="number">
            <p className="type">Conduce / Entrega</p>
            <p className="id">{delivery.number}</p>
            <p className="meta" style={{ marginTop: 6 }}>
              Generado: {new Date(delivery.createdAt).toLocaleDateString("es-DO")}
            </p>
            <span className="status-pill muted" style={{ marginTop: 6, marginLeft: 0 }}>
              {STATUS_LABEL[delivery.status] ?? delivery.status}
            </span>
          </div>
        </header>

        <div className="doc-parties">
          <div className="party">
            <p className="label">Cliente</p>
            <p className="name">{delivery.invoice.customer.legalName}</p>
            {delivery.invoice.customer.documentNumber && (
              <p className="line muted">RNC/Céd {delivery.invoice.customer.documentNumber}</p>
            )}
            {delivery.invoice.customer.address && (
              <p className="line muted">{delivery.invoice.customer.address}</p>
            )}
          </div>
          <div className="party">
            <p className="label">Factura asociada</p>
            <p className="name">{delivery.invoice.number}</p>
            {delivery.invoice.ncf && (
              <p className="line muted">NCF {delivery.invoice.ncf}</p>
            )}
            <p className="line">
              Chofer: <strong>{delivery.driverName ?? "—"}</strong>
            </p>
            <p className="line">
              Placa: <strong>{delivery.vehiclePlate ?? "—"}</strong>
            </p>
            {delivery.route && (
              <p className="line muted">Ruta: {delivery.route}</p>
            )}
          </div>
        </div>

        <table className="items">
          <thead>
            <tr>
              <th>Descripción</th>
              <th className="right">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {delivery.items.map((it) => (
              <tr key={it.id}>
                <td>{it.description}</td>
                <td className="right mono">{Number(it.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {delivery.notes && (
          <div className="notes">
            <p className="title">Observaciones</p>
            <p>{delivery.notes}</p>
          </div>
        )}

        <div
          style={{
            marginTop: "3rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3rem",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                borderTop: "1px solid #0f172a",
                paddingTop: "0.5rem",
                fontSize: "0.75rem",
                color: "#64748b",
              }}
            >
              Entregado por
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                borderTop: "1px solid #0f172a",
                paddingTop: "0.5rem",
                fontSize: "0.75rem",
                color: "#64748b",
              }}
            >
              Recibido conforme · Firma y cédula
            </div>
          </div>
        </div>

        <footer className="doc-foot">
          <p>Este documento es logístico, no constituye comprobante fiscal.</p>
          <p>Para fines fiscales referirse a {delivery.invoice.number}</p>
        </footer>
      </div>
    </>
  );
}
