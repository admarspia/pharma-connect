import { z } from "zod";

export const registerPharmacySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  ownerName: z.string().min(2),
  businessName: z.string().min(2),
  phone: z.string().optional(),
  addressLine: z.string().min(3),
  city: z.string().min(2),
  country: z.string().min(2),
});

export const loginPharmacySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterPharmacyInput = z.infer<typeof registerPharmacySchema>;
export type LoginPharmacyInput = z.infer<typeof loginPharmacySchema>;
