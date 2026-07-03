import { z } from "zod";

export const createReservationSchema = z.object({
  pharmacyId: z.string().uuid(),
  prescriptionId: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        medicineId: z.string().uuid(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
});

export const reviewReservationSchema = z.object({
  decision: z.enum(["ACCEPTED", "REJECTED"]),
  note: z.string().optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type ReviewReservationInput = z.infer<typeof reviewReservationSchema>;
