import { prisma } from "../../config/db";
import { PharmacyLicenseStatus } from "@prisma/client";

export const pharmacyRepository = {
  findByEmail: (email: string) => prisma.pharmacy.findFirst({ where: { email, deletedAt: null } }),

  findById: (id: string) => prisma.pharmacy.findFirst({ where: { id, deletedAt: null } }),

  create: (data: {
    email: string;
    passwordHash: string;
    ownerName: string;
    businessName: string;
    phone?: string;
    addressLine: string;
    city: string;
    country: string;
  }) => prisma.pharmacy.create({ data }),

  markEmailVerified: (id: string) =>
    prisma.pharmacy.update({ where: { id }, data: { emailVerified: true } }),

  softDelete: (id: string) => prisma.pharmacy.update({ where: { id }, data: { deletedAt: new Date() } }),

  createVerificationToken: (token: string, pharmacyId: string, expiresAt: Date) =>
    prisma.emailVerificationToken.create({ data: { token, pharmacyId, expiresAt } }),

  findValidVerificationToken: (token: string) =>
    prisma.emailVerificationToken.findFirst({
      where: { token, consumedAt: null, expiresAt: { gt: new Date() } },
    }),

  consumeVerificationToken: (id: string) =>
    prisma.emailVerificationToken.update({ where: { id }, data: { consumedAt: new Date() } }),

  attachLicenseDocument: (id: string, licenseDocumentUrl: string, licenseAiScore: unknown) =>
    prisma.pharmacy.update({
      where: { id },
      data: {
        licenseDocumentUrl,
        licenseAiScore: licenseAiScore as any,
        licenseStatus: PharmacyLicenseStatus.PENDING,
      },
    }),

  setGeolocation: (id: string, latitude: number, longitude: number, addressVerified: boolean) =>
    prisma.pharmacy.update({ where: { id }, data: { latitude, longitude, addressVerified } }),

  reviewLicense: (id: string, status: PharmacyLicenseStatus, reviewedBy: string) =>
    prisma.pharmacy.update({
      where: { id },
      data: { licenseStatus: status, licenseReviewedBy: reviewedBy, licenseReviewedAt: new Date() },
    }),

  listPendingReview: () =>
    prisma.pharmacy.findMany({
      where: { licenseStatus: PharmacyLicenseStatus.PENDING, deletedAt: null },
      orderBy: { createdAt: "asc" },
    }),

  findNearby: (latitude: number, longitude: number, radiusKm: number) =>
    // Simple bounding-box prefilter in SQL; precise haversine distance is
    // computed in the service layer. Keeps this portable across Postgres
    // versions without requiring PostGIS.
    prisma.$queryRaw<
      Array<{ id: string; businessName: string; latitude: number; longitude: number }>
    >`
      SELECT id, "businessName", latitude, longitude
      FROM pharmacies
      WHERE "deletedAt" IS NULL
        AND "licenseStatus" = 'APPROVED'
        AND latitude IS NOT NULL AND longitude IS NOT NULL
        AND latitude BETWEEN ${latitude - radiusKm / 111.0} AND ${latitude + radiusKm / 111.0}
        AND longitude BETWEEN ${longitude - radiusKm / 111.0} AND ${longitude + radiusKm / 111.0}
    `,
};
