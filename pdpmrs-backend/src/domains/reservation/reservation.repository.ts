import { prisma } from "../../config/db";
import { ReservationStatus } from "@prisma/client";

export const reservationRepository = {
  create: (data: {
    patientId: string;
    pharmacyId: string;
    prescriptionId?: string;
    expiresAt: Date;
    items: Array<{ medicineId: string; quantity: number }>;
  }) =>
    prisma.reservation.create({
      data: {
        patientId: data.patientId,
        pharmacyId: data.pharmacyId,
        prescriptionId: data.prescriptionId,
        expiresAt: data.expiresAt,
        items: { create: data.items },
      },
      include: { items: { include: { medicine: true } } },
    }),

  findById: (id: string) =>
    prisma.reservation.findUnique({
      where: { id },
      include: { items: { include: { medicine: true } }, pharmacy: true, patient: true, prescription: true },
    }),

  findByPatient: (patientId: string) =>
    prisma.reservation.findMany({
      where: { patientId },
      include: { items: { include: { medicine: true } }, pharmacy: true },
      orderBy: { createdAt: "desc" },
    }),

  findByPharmacy: (pharmacyId: string, status?: ReservationStatus) =>
    prisma.reservation.findMany({
      where: { pharmacyId, ...(status ? { status } : {}) },
      include: { items: { include: { medicine: true } }, patient: true },
      orderBy: { createdAt: "desc" },
    }),

  updateStatus: (id: string, status: ReservationStatus, note?: string) =>
    prisma.reservation.update({
      where: { id },
      data: { status, reviewNote: note, reviewedAt: new Date() },
    }),

  findExpiredPending: () =>
    prisma.reservation.findMany({
      where: { status: ReservationStatus.PENDING, expiresAt: { lt: new Date() } },
    }),

  bulkExpire: (ids: string[]) =>
    prisma.reservation.updateMany({
      where: { id: { in: ids } },
      data: { status: ReservationStatus.EXPIRED },
    }),
};
