import { z } from "zod";

export const companyFormSchema = z.object({
  legalName: z.string().min(2).max(200),
  tradeName: z.string().max(200).optional().nullable(),
  rnc: z.string().max(20).optional().nullable(),
  logoUrl: z.string().url().optional().or(z.literal("")).nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().max(40).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().length(2).default("DO"),
  currency: z.string().length(3).default("DOP"),
  timezone: z.string().default("America/Santo_Domingo"),
});
export type CompanyFormInput = z.infer<typeof companyFormSchema>;

export const branchFormSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(2).max(100),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  isMain: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type BranchFormInput = z.infer<typeof branchFormSchema>;

export const ncfSequenceFormSchema = z.object({
  type: z.enum(["B01", "B02", "B03", "B04", "B11", "B12", "B13", "B14", "B15", "B16", "B17"]),
  branchId: z.string().cuid().optional().nullable(),
  rangeFrom: z.coerce.number().int().positive(),
  rangeTo: z.coerce.number().int().positive(),
  expiresAt: z.coerce.date().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
}).refine((d) => d.rangeTo >= d.rangeFrom, {
  message: "El rango final debe ser mayor o igual al inicial",
  path: ["rangeTo"],
});
export type NcfSequenceFormInput = z.infer<typeof ncfSequenceFormSchema>;

export const taxConfigFormSchema = z.object({
  key: z.string().min(1).max(40).regex(/^[A-Z0-9_]+$/, "Solo mayúsculas, números y guiones bajos"),
  name: z.string().min(2).max(100),
  rate: z.coerce.number().min(0).max(1, "Debe ser una fracción decimal (0.18 = 18%)"),
  isWithholding: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type TaxConfigFormInput = z.infer<typeof taxConfigFormSchema>;
