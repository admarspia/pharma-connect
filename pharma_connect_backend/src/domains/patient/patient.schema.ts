import { z } from "zod";

export const registerPatientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  preferredLanguage: z.string().length(2).optional(),
});

export const loginPatientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10),
});

export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;
export type LoginPatientInput = z.infer<typeof loginPatientSchema>;
