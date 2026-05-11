import { z } from "zod";

export const invoiceItemInputSchema = z.object({
  productId: z.string().cuid().nullable().optional(),
  description: z.string().min(1, "Descripción requerida"),
  quantity: z.coerce.number().positive("Cantidad debe ser > 0"),
  unitPrice: z.coerce.number().nonnegative(),
  discount: z.coerce.number().nonnegative().default(0),
  taxRate: z.coerce.number().min(0).max(1).default(0.18),
  position: z.number().int().nonnegative().default(0),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().cuid(),
  branchId: z.string().cuid().nullable().optional(),
  ncfType: z
    .enum(["B01", "B02", "B03", "B04", "B11", "B12", "B13", "B14", "B15", "B16", "B17"])
    .optional(),
  paymentMethod: z.enum(["CASH", "CARD", "TRANSFER", "CHECK", "CREDIT", "MIXED", "DIGITAL_WALLET", "OTHER"]).default("CASH"),
  isCredit: z.boolean().default(false),
  dueDate: z.coerce.date().optional(),
  currency: z.string().length(3).default("DOP"),
  exchangeRate: z.coerce.number().positive().default(1),
  tipAmount: z.coerce.number().nonnegative().default(0),
  items: z.array(invoiceItemInputSchema).min(1, "Al menos un ítem"),
  notes: z.string().max(2000).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const voidInvoiceSchema = z.object({
  invoiceId: z.string().cuid(),
  reason: z.string().min(5, "Razón requerida"),
});
