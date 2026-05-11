// ============================================================================
// Helpers fiscales — República Dominicana
// ============================================================================

/**
 * Valida RNC (9 dígitos) o cédula dominicana (11 dígitos).
 */
export function isValidDocumentNumber(doc: string): boolean {
  const clean = doc.replace(/[-\s]/g, "");
  if (!/^\d+$/.test(clean)) return false;
  return clean.length === 9 || clean.length === 11;
}

/**
 * Formatea NCF a string completo: B02 + secuencia 8 dígitos padding 0.
 */
export function formatNcf(prefix: string, sequence: number): string {
  return `${prefix}${String(sequence).padStart(8, "0")}`;
}

/**
 * Parsea NCF string a (prefix, sequence).
 */
export function parseNcf(ncf: string): { prefix: string; sequence: number } | null {
  const m = /^([A-Z]\d{2})(\d{8})$/.exec(ncf.trim());
  if (!m) return null;
  return { prefix: m[1], sequence: parseInt(m[2], 10) };
}

export const NCF_TYPE_LABELS: Record<string, string> = {
  B01: "Crédito Fiscal",
  B02: "Consumo",
  B03: "Nota de Débito",
  B04: "Nota de Crédito",
  B11: "Comprobante de Compras",
  B12: "Registro Único de Ingresos",
  B13: "Gastos Menores",
  B14: "Régimen Especial",
  B15: "Gubernamental",
  B16: "Exportaciones",
  B17: "Pagos al Exterior",
};
