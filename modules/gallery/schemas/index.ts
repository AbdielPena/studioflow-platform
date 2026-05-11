import { z } from "zod";
import { slugify } from "@/packages/lib/utils";

export const galleryFormSchema = z
  .object({
    title: z.string().min(2).max(200),
    slug: z.string().max(60).optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
    coverUrl: z.string().url().optional().or(z.literal("")).nullable(),
    customerId: z.string().cuid().optional().nullable(),
    projectId: z.string().cuid().optional().nullable(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "EXPIRED"]).default("DRAFT"),
    password: z.string().max(60).optional().nullable(),
    expiresAt: z.coerce.date().optional().nullable(),
    isPublic: z.boolean().default(false),
  })
  .transform((d) => ({
    ...d,
    slug: d.slug ? slugify(d.slug) : slugify(d.title),
  }));

export type GalleryFormInput = z.input<typeof galleryFormSchema>;
export type GalleryFormOutput = z.output<typeof galleryFormSchema>;

export const verifyGalleryPasswordSchema = z.object({
  slug: z.string(),
  password: z.string(),
});
