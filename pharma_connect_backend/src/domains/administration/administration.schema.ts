import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const licenseDecisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "SUSPENDED"]),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
