import { z } from "zod";

export const productTypeSchema = z.enum(["PRODUCT", "SERVICE"]);

export const productFormSchema = z.object({
  type: productTypeSchema.default("PRODUCT"),
  sku: z.string().min(1, "SKU requerido").max(60),
  barcode: z.string().max(60).optional().nullable(),
  name: z.string().min(2, "Mínimo 2 caracteres").max(200),
  description: z.string().max(2000).optional().nullable(),
  unit: z.string().max(10).default("UND"),
  price: z.coerce.number().nonnegative("Precio no puede ser negativo"),
  costReference: z.coerce.number().nonnegative().optional().nullable(),
  taxConfigKey: z.string().default("ITBIS_18"),
  categoryId: z.string().cuid().optional().nullable(),
  imageUrl: z.string().url().optional().or(z.literal("")).nullable(),
  externalId: z.string().max(120).optional().nullable(),
  isActive: z.boolean().default(true),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;

export const productCategoryFormSchema = z.object({
  name: z.string().min(2).max(100),
  parentId: z.string().cuid().optional().nullable(),
});

export type ProductCategoryFormInput = z.infer<typeof productCategoryFormSchema>;
