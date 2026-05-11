import { formatCurrency } from "@/packages/lib/decimal";

type DocumentLine = {
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  discount?: string | number;
  taxAmount?: string | number;
  lineTotal: string | number;
};

type Company = {
  legalName: string;
  tradeName: string | null;
  rnc: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
};

type Counterparty = {
  legalName: string;
  documentNumber: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
};

type Props = {
  documentType: string;
  documentNumber: string;
  ncf?: string | null;
  issueDate: Date;
  dueDate?: Date | null;
  status?: { label: string; tone: "success" | "warning" | "destructive" | "muted" };
  company: Company;
  counterparty: { label: string; data: Counterparty };
  items: DocumentLine[];
  subtotal: string;
  discountTotal?: string;
  taxTotal: string;
  total: string;
  paidAmount?: string;
  balanceDue?: string;
  notes?: string | null;
  terms?: string | null;
};

export function DocumentShell({
  documentType,
  documentNumber,
  ncf,
  issueDate,
  dueDate,
  status,
  company,
  counterparty,
  items,
  subtotal,
  discountTotal,
  taxTotal,
  total,
  paidAmount,
  balanceDue,
  notes,
  terms,
}: Props) {
  return (
    <div className="print-page">
      <header className="doc-head">
        <div>
          <p className="brand">{company.tradeName ?? company.legalName}</p>
          <p className="meta">
            {company.legalName !== company.tradeName && (
              <>
                {company.legalName}
                <br />
              </>
            )}
            {company.rnc && (
              <>
                RNC {company.rnc}
                <br />
              </>
            )}
            {company.address}
            {company.city && `, ${company.city}`}
            <br />
            {company.phone && <>{company.phone} · </>}
            {company.email}
          </p>
        </div>
        <div className="number">
          <p className="type">{documentType}</p>
          <p className="id">{documentNumber}</p>
          {ncf && <p className="ncf">NCF {ncf}</p>}
          <p className="meta" style={{ marginTop: 6 }}>
            Emisión: {issueDate.toLocaleDateString("es-DO")}
          </p>
          {dueDate && (
            <p className="meta">
              Vence: {dueDate.toLocaleDateString("es-DO")}
            </p>
          )}
          {status && (
            <span className={`status-pill ${status.tone}`} style={{ marginTop: 6, marginLeft: 0 }}>
              {status.label}
            </span>
          )}
        </div>
      </header>

      <div className="doc-parties">
        <div className="party">
          <p className="label">Emisor</p>
          <p className="name">{company.legalName}</p>
          {company.rnc && <p className="line muted">RNC {company.rnc}</p>}
        </div>
        <div className="party">
          <p className="label">{counterparty.label}</p>
          <p className="name">{counterparty.data.legalName}</p>
          {counterparty.data.documentNumber && (
            <p className="line muted">RNC/Céd {counterparty.data.documentNumber}</p>
          )}
          {counterparty.data.address && (
            <p className="line muted">{counterparty.data.address}</p>
          )}
          {counterparty.data.email && (
            <p className="line muted">{counterparty.data.email}</p>
          )}
          {counterparty.data.phone && (
            <p className="line muted">{counterparty.data.phone}</p>
          )}
        </div>
      </div>

      <table className="items">
        <thead>
          <tr>
            <th>Descripción</th>
            <th className="right">Cant.</th>
            <th className="right">Precio</th>
            {discountTotal && <th className="right">Desc.</th>}
            <th className="right">ITBIS</th>
            <th className="right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{it.description}</td>
              <td className="right mono">{Number(it.quantity).toFixed(2)}</td>
              <td className="right mono">{formatCurrency(it.unitPrice)}</td>
              {discountTotal && (
                <td className="right mono">{formatCurrency(it.discount ?? "0")}</td>
              )}
              <td className="right mono">{formatCurrency(it.taxAmount ?? "0")}</td>
              <td className="right mono">{formatCurrency(it.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="totals">
        <div className="row muted">
          <span>Subtotal</span>
          <span className="amount">{formatCurrency(subtotal)}</span>
        </div>
        {discountTotal && Number(discountTotal) > 0 && (
          <div className="row muted">
            <span>Descuento</span>
            <span className="amount">- {formatCurrency(discountTotal)}</span>
          </div>
        )}
        <div className="row muted">
          <span>ITBIS</span>
          <span className="amount">{formatCurrency(taxTotal)}</span>
        </div>
        <div className="row grand">
          <span>Total</span>
          <span className="amount">{formatCurrency(total)}</span>
        </div>
        {paidAmount && Number(paidAmount) > 0 && (
          <div className="row muted">
            <span>Pagado</span>
            <span className="amount">{formatCurrency(paidAmount)}</span>
          </div>
        )}
        {balanceDue && Number(balanceDue) > 0 && (
          <div className="row balance">
            <span>Balance</span>
            <span className="amount">{formatCurrency(balanceDue)}</span>
          </div>
        )}
      </div>

      {notes && (
        <div className="notes">
          <p className="title">Notas</p>
          <p>{notes}</p>
        </div>
      )}

      {terms && (
        <div className="notes">
          <p className="title">Términos</p>
          <p>{terms}</p>
        </div>
      )}

      <footer className="doc-foot">
        <p>Documento generado por StudioFlow Platform</p>
        <p>{new Date().toLocaleString("es-DO")}</p>
      </footer>
    </div>
  );
}
