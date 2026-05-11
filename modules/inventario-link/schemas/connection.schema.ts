import { z } from "zod";

export const connectionFormSchema = z.object({
  name: z.string().min(2).max(100),
  baseUrl: z.string().url("URL inválida"),
  authType: z.enum(["BEARER", "BASIC", "API_KEY", "HMAC"]).default("BEARER"),
  authToken: z.string().max(500).optional().nullable(),
  apiKey: z.string().max(500).optional().nullable(),
  customHeaders: z.record(z.string()).optional().nullable(),
  endpoints: z
    .object({
      stock: z.string().optional(),
      reserve: z.string().optional(),
      commit: z.string().optional(),
      release: z.string().optional(),
      products: z.string().optional(),
    })
    .partial()
    .default({}),
  timeoutMs: z.coerce.number().int().positive().default(10000),
  maxRetries: z.coerce.number().int().min(0).max(10).default(3),
  manualMode: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type ConnectionFormInput = z.infer<typeof connectionFormSchema>;
