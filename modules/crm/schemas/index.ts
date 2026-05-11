import { z } from "zod";

export const leadFormSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().max(40).optional().nullable(),
  source: z.string().max(80).optional().nullable(),
  stage: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"]).default("NEW"),
  estimatedValue: z.coerce.number().nonnegative().optional().nullable(),
  customerId: z.string().cuid().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});
export type LeadFormInput = z.infer<typeof leadFormSchema>;

export const updateLeadStageSchema = z.object({
  leadId: z.string().cuid(),
  stage: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"]),
});

export const projectFormSchema = z.object({
  customerId: z.string().cuid(),
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional().nullable(),
  status: z
    .enum(["LEAD", "BOOKED", "IN_PROGRESS", "EDITING", "DELIVERED", "COMPLETED", "CANCELLED"])
    .default("LEAD"),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  amount: z.coerce.number().nonnegative().optional().nullable(),
});
export type ProjectFormInput = z.infer<typeof projectFormSchema>;
