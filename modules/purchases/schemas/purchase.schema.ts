import { z } from "zod";

export const purchaseItemSchema = z.object({
  productId: z.string().cuid().nullable().optional(),
  description: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().nonnegative(),
  taxRate: z.coerce.number().min(0).max(1).default(0.18),
  position: z.number().int().nonnegative().default(0),
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().cuid(),
  branchId: z.string().cuid().nullable().optional(),
  ncfSupplier: z.string().max(20).optional().nullable(),
  isCredit: z.boolean().default(false),
  dueDate: z.coerce.date().optional().nullable(),
  currency: z.string().length(3).default("DOP"),
  exchangeRate: z.coerce.number().positive().default(1),
  items: z.array(purchaseItemSchema).min(1),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
