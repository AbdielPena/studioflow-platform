import { Decimal } from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_EVEN });

export type Money = Decimal;

export const D = (value: Decimal.Value | null | undefined): Decimal => {
  if (value === null || value === undefined) return new Decimal(0);
  return new Decimal(value);
};

export const ZERO = new Decimal(0);
export const ONE = new Decimal(1);

export function toMoney(value: Decimal.Value | null | undefined, decimals = 2): string {
  return D(value).toFixed(decimals);
}

export function sumMoney(values: Array<Decimal.Value | null | undefined>): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(D(v)), ZERO);
}

export function applyTax(
  amount: Decimal.Value,
  rate: Decimal.Value,
): { taxAmount: Decimal; total: Decimal } {
  const base = D(amount);
  const r = D(rate);
  const taxAmount = base.times(r);
  return { taxAmount, total: base.plus(taxAmount) };
}

export function applyDiscount(
  amount: Decimal.Value,
  discount: Decimal.Value,
): Decimal {
  return D(amount).minus(D(discount));
}

export function calculateLineTotal({
  quantity,
  unitPrice,
  discount = 0,
  taxRate = 0,
}: {
  quantity: Decimal.Value;
  unitPrice: Decimal.Value;
  discount?: Decimal.Value;
  taxRate?: Decimal.Value;
}): {
  subtotal: Decimal;
  discountAmount: Decimal;
  taxableBase: Decimal;
  taxAmount: Decimal;
  total: Decimal;
} {
  const qty = D(quantity);
  const price = D(unitPrice);
  const subtotal = qty.times(price);
  const discountAmount = D(discount);
  const taxableBase = subtotal.minus(discountAmount);
  const taxAmount = taxableBase.times(D(taxRate));
  const total = taxableBase.plus(taxAmount);
  return { subtotal, discountAmount, taxableBase, taxAmount, total };
}

export function formatCurrency(
  value: Decimal.Value | null | undefined,
  currency = "DOP",
  locale = "es-DO",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(D(value).toNumber());
}

export { Decimal };
