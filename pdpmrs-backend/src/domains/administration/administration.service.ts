import { prisma } from "../../config/db";
import { ApiError } from "../../common/ApiError";
import { comparePassword } from "../../utils/password";
import { signToken } from "../../utils/jwt";
import { pharmacyRepository } from "../pharmacy/pharmacy.repository";
import { recordAudit } from "./audit.service";
import { AdminLoginInput } from "./administration.schema";
import { PharmacyLicenseStatus, ReservationStatus } from "@prisma/client";

export const administrationService = {
  async login(input: AdminLoginInput) {
    const admin = await prisma.adminUser.findFirst({ where: { email: input.email, deletedAt: null } });
    if (!admin) throw ApiError.unauthorized("Invalid email or password");

    const valid = await comparePassword(input.password, admin.passwordHash);
    if (!valid) throw ApiError.unauthorized("Invalid email or password");

    const token = signToken({ sub: admin.id, role: "ADMIN", email: admin.email });
    return { token, admin: { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role } };
  },

  async listPendingPharmacies() {
    return pharmacyRepository.listPendingReview();
  },

  async decidePharmacyLicense(
    adminId: string,
    pharmacyId: string,
    decision: PharmacyLicenseStatus
  ) {
    const pharmacy = await pharmacyRepository.reviewLicense(pharmacyId, decision, adminId);

    await recordAudit({
      actorId: adminId,
      actorType: "ADMIN",
      action: `PHARMACY_LICENSE_${decision}`,
      entityType: "Pharmacy",
      entityId: pharmacyId,
    });

    return pharmacy;
  },

  async platformAnalytics() {
    const [totalPatients, totalPharmacies, reservationsByStatus, lowStockCount] = await Promise.all([
      prisma.patient.count({ where: { deletedAt: null } }),
      prisma.pharmacy.count({ where: { deletedAt: null } }),
      prisma.reservation.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM stocks WHERE quantity <= "lowStockThreshold"
      `,
    ]);

    const reservationCounts = Object.fromEntries(
      (Object.values(ReservationStatus) as string[]).map((s) => [
        s,
        reservationsByStatus.find((r: { status: string }) => r.status === s)?._count._all ?? 0,
      ])
    );

    return {
      totalPatients,
      totalPharmacies,
      reservations: reservationCounts,
      lowStockAlertCount: Number(lowStockCount[0]?.count ?? 0),
    };
  },

  async listAuditLogs(entityType?: string, limit = 100) {
    return prisma.auditLog.findMany({
      where: entityType ? { entityType } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },
};
