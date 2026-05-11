import { z } from "zod";

export const openCashSessionSchema = z.object({
  cashRegisterId: z.string().cuid(),
  openingAmount: z.coerce.number().nonnegative().default(0),
  notes: z.string().max(500).optional().nullable(),
});

export const closeCashSessionSchema = z.object({
  sessionId: z.string().cuid(),
  closingAmount: z.coerce.number().nonnegative(),
  notes: z.string().max(500).optional().nullable(),
});

export const createCashRegisterSchema = z.object({
  name: z.string().min(2).max(100),
  branchId: z.string().cuid().optional().nullable(),
});

export const createBankAccountSchema = z.object({
  name: z.string().min(2).max(100),
  bankName: z.string().max(120).optional().nullable(),
  accountNumber: z.string().max(60).optional().nullable(),
  accountType: z.enum(["CHECKING", "SAVINGS", "WALLET"]).optional().nullable(),
  currency: z.string().length(3).default("DOP"),
  isActive: z.boolean().default(true),
});

export type OpenCashSessionInput = z.infer<typeof openCashSessionSchema>;
export type CloseCashSessionInput = z.infer<typeof closeCashSessionSchema>;
export type CreateCashRegisterInput = z.infer<typeof createCashRegisterSchema>;
export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
