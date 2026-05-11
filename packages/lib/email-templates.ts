import { formatCurrency } from "./decimal";

// ============================================================================
// Email HTML templates — minimal inline-styled para máxima compatibilidad
// ============================================================================

const BASE_STYLES = `
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
  .wrap { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(15,23,42,0.06); }
  .header { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 28px 32px; }
  .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
  .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.08em; }
  .body { padding: 28px 32px; }
  .body p { line-height: 1.5; margin: 0 0 12px; }
  .summary { background: #f8fafc; border-radius: 12px; padding: 16px 20px; margin: 20px 0; }
  .summary .row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
  .summary .row.total { border-top: 1px solid #cbd5e1; margin-top: 8px; padding-top: 10px; font-weight: 700; font-size: 16px; }
  .btn { display: inline-block; background: #3b82f6; color: white !important; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-weight: 500; font-size: 14px; }
  .footer { background: #f8fafc; padding: 18px 32px; font-size: 11px; color: #64748b; text-align: center; }
`;

export function invoiceEmailTemplate(opts: {
  customerName: string;
  invoiceNumber: string;
  ncf: string | null;
  total: string;
  balanceDue: string;
  dueDate: Date | null;
  companyName: string;
  invoiceUrl?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Factura ${opts.invoiceNumber}</title><style>${BASE_STYLES}</style></head>
<body>
  <div class="wrap">
    <div class="header">
      <p>Factura</p>
      <h1>${opts.invoiceNumber}${opts.ncf ? ` · NCF ${opts.ncf}` : ""}</h1>
    </div>
    <div class="body">
      <p>Hola <strong>${opts.customerName}</strong>,</p>
      <p>Adjunto detalle de tu factura de <strong>${opts.companyName}</strong>.</p>
      <div class="summary">
        <div class="row"><span>Total facturado</span><span>${formatCurrency(opts.total)}</span></div>
        <div class="row total"><span>Balance pendiente</span><span>${formatCurrency(opts.balanceDue)}</span></div>
      </div>
      ${opts.dueDate ? `<p style="font-size:12px;color:#64748b">Fecha de vencimiento: ${opts.dueDate.toLocaleDateString("es-DO")}</p>` : ""}
      ${opts.invoiceUrl ? `<p style="margin-top:24px"><a class="btn" href="${opts.invoiceUrl}">Ver factura completa</a></p>` : ""}
      <p style="margin-top:24px;font-size:12px;color:#64748b">Cualquier consulta, responde a este correo.</p>
    </div>
    <div class="footer">${opts.companyName} · Generado por StudioFlow Platform</div>
  </div>
</body>
</html>
  `.trim();
}

export function overdueReminderTemplate(opts: {
  customerName: string;
  invoiceNumber: string;
  balanceDue: string;
  dueDate: Date;
  daysOverdue: number;
  companyName: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Recordatorio de pago</title><style>${BASE_STYLES}</style></head>
<body>
  <div class="wrap">
    <div class="header" style="background:linear-gradient(135deg,#f97316,#c2410c)">
      <p>Recordatorio</p>
      <h1>Factura vencida ${opts.invoiceNumber}</h1>
    </div>
    <div class="body">
      <p>Hola <strong>${opts.customerName}</strong>,</p>
      <p>Te escribimos para recordarte que tienes una factura vencida con <strong>${opts.companyName}</strong>.</p>
      <div class="summary">
        <div class="row"><span>Factura</span><span>${opts.invoiceNumber}</span></div>
        <div class="row"><span>Fecha de vencimiento</span><span>${opts.dueDate.toLocaleDateString("es-DO")}</span></div>
        <div class="row"><span>Días vencida</span><span>${opts.daysOverdue} día${opts.daysOverdue === 1 ? "" : "s"}</span></div>
        <div class="row total"><span>Balance pendiente</span><span>${formatCurrency(opts.balanceDue)}</span></div>
      </div>
      <p style="margin-top:16px;font-size:13px">Por favor coordina el pago para evitar interrupciones en el servicio. Si ya realizaste el pago, ignora este correo.</p>
    </div>
    <div class="footer">${opts.companyName} · Generado por StudioFlow Platform</div>
  </div>
</body>
</html>
  `.trim();
}

export function galleryReadyTemplate(opts: {
  customerName: string;
  galleryTitle: string;
  galleryUrl: string;
  password?: string;
  companyName: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>${opts.galleryTitle}</title><style>${BASE_STYLES}</style></head>
<body>
  <div class="wrap">
    <div class="header">
      <p>Tu galería está lista</p>
      <h1>${opts.galleryTitle}</h1>
    </div>
    <div class="body">
      <p>Hola <strong>${opts.customerName}</strong>,</p>
      <p>Las fotos de tu sesión ya están disponibles en línea.</p>
      <p style="margin-top:20px"><a class="btn" href="${opts.galleryUrl}">Ver galería</a></p>
      ${opts.password ? `<div class="summary"><div class="row"><span>Contraseña</span><span style="font-family:ui-monospace,Menlo,monospace"><strong>${opts.password}</strong></span></div></div>` : ""}
    </div>
    <div class="footer">${opts.companyName} · Powered by StudioFlow Platform</div>
  </div>
</body>
</html>
  `.trim();
}
