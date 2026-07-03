import { z } from "zod";

export const addStockSchema = z.object({
  medicineId: z.string().uuid(),
  quantity: z.number().int().min(0),
  price: z.number().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
});

export const updateStockSchema = z.object({
  quantity: z.number().int().min(0).optional(),
  price: z.number().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
});

export type AddStockInput = z.infer<typeof addStockSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
