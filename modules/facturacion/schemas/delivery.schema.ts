import { z } from "zod";

export const createDeliverySchema = z.object({
  invoiceId: z.string().cuid(),
  driverName: z.string().max(120).optional().nullable(),
  vehiclePlate: z.string().max(20).optional().nullable(),
  route: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  items: z
    .array(
      z.object({
        invoiceItemId: z.string().cuid(),
        description: z.string(),
        quantity: z.coerce.number().positive(),
      }),
    )
    .min(1),
});
export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;

export const updateDeliveryStatusSchema = z.object({
  deliveryId: z.string().cuid(),
  status: z.enum(["PENDING", "IN_TRANSIT", "DELIVERED", "SIGNED", "CANCELLED"]),
});
