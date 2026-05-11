import { z } from "zod";

export const customerTypeSchema = z.enum(["INDIVIDUAL", "COMPANY", "FINAL_CONSUMER"]);

export const customerFormSchema = z.object({
  code: z.string().max(40).optional().nullable(),
  type: customerTypeSchema.default("INDIVIDUAL"),
  legalName: z.string().min(2, "Mínimo 2 caracteres").max(200),
  tradeName: z.string().max(200).optional().nullable(),
  documentNumber: z.string().max(20).optional().nullable(),
  email: z.string().email("Correo inválido").optional().or(z.literal("")).nullable(),
  phone: z.string().max(40).optional().nullable(),
  mobile: z.string().max(40).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().length(2).default("DO"),
  creditLimit: z.coerce.number().nonnegative().default(0),
  notes: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export type CustomerFormInput = z.infer<typeof customerFormSchema>;

export const customerListFiltersSchema = z.object({
  query: z.string().optional(),
  type: customerTypeSchema.optional(),
  isActive: z.boolean().optional(),
});

export type CustomerListFilters = z.infer<typeof customerListFiltersSchema>;
