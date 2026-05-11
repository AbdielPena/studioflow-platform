import { z } from "zod";
import { invoiceItemInputSchema } from "./invoice.schema";

export const createQuoteSchema = z.object({
  customerId: z.string().cuid(),
  branchId: z.string().cuid().nullable().optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  currency: z.string().length(3).default("DOP"),
  exchangeRate: z.coerce.number().positive().default(1),
  items: z.array(invoiceItemInputSchema).min(1, "Al menos un ítem"),
  notes: z.string().max(2000).optional().nullable(),
  terms: z.string().max(2000).optional().nullable(),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
