import { prisma } from "../../config/db";

export const patientRepository = {
  findByEmail: (email: string) =>
    prisma.patient.findFirst({ where: { email, deletedAt: null } }),

  findById: (id: string) => prisma.patient.findFirst({ where: { id, deletedAt: null } }),

  create: (data: {
    email: string;
    passwordHash: string;
    fullName: string;
    phone?: string;
    preferredLanguage?: string;
  }) => prisma.patient.create({ data }),

  markEmailVerified: (id: string) =>
    prisma.patient.update({ where: { id }, data: { emailVerified: true } }),

  softDelete: (id: string) =>
    prisma.patient.update({ where: { id }, data: { deletedAt: new Date() } }),

  createVerificationToken: (token: string, patientId: string, expiresAt: Date) =>
    prisma.emailVerificationToken.create({ data: { token, patientId, expiresAt } }),

  findValidVerificationToken: (token: string) =>
    prisma.emailVerificationToken.findFirst({
      where: { token, consumedAt: null, expiresAt: { gt: new Date() } },
    }),

  consumeVerificationToken: (id: string) =>
    prisma.emailVerificationToken.update({ where: { id }, data: { consumedAt: new Date() } }),
};
