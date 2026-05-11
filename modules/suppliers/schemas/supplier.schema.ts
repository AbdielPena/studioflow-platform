import { z } from "zod";

export const supplierFormSchema = z.object({
  code: z.string().max(40).optional().nullable(),
  legalName: z.string().min(2).max(200),
  tradeName: z.string().max(200).optional().nullable(),
  documentNumber: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().max(40).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  paymentTerms: z.coerce.number().int().nonnegative().default(0),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  notes: z.string().max(2000).optional().nullable(),
});

export type SupplierFormInput = z.infer<typeof supplierFormSchema>;
