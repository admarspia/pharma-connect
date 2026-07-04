import { ApiError } from "../../common/ApiError";
import { env } from "../../config/env";
import { prisma } from "../../config/db";
import { reservationRepository } from "./reservation.repository";
import { recordAudit } from "../administration/audit.service";
import { sendReservationStatusEmail } from "../notification/email.client";
import { CreateReservationInput, ReviewReservationInput } from "./reservation.schema";
import { Prisma, ReservationStatus } from "@prisma/client";
import { logger } from "../../common/logger";

export const reservationService = {
  /** Creates a reservation, optionally linked to a prescription's AI analysis output. */
  async create(patientId: string, input: CreateReservationInput) {
    // Verify stock availability up front; actual decrement happens on completion,
    // not at reservation time, since a reservation can still be rejected/expired.
    for (const item of input.items) {
      const stock = await prisma.stock.findUnique({
        where: { pharmacyId_medicineId: { pharmacyId: input.pharmacyId, medicineId: item.medicineId } },
      });
      if (!stock || stock.quantity < item.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock for medicine ${item.medicineId} at the selected pharmacy`
        );
      }
    }

    const expiresAt = new Date(Date.now() + env.reservation.expiryHours * 60 * 60 * 1000);

    const reservation = await reservationRepository.create({
      patientId,
      pharmacyId: input.pharmacyId,
      prescriptionId: input.prescriptionId,
      expiresAt,
      items: input.items,
    });

    await recordAudit({
      actorId: patientId,
      actorType: "PATIENT",
      action: "RESERVATION_CREATED",
      entityType: "Reservation",
      entityId: reservation.id,
    });

    return reservation;
  },

  async getById(id: string, requesterId: string, requesterRole: string) {
    const reservation = await reservationRepository.findById(id);
    if (!reservation) throw ApiError.notFound("Reservation not found");

    const isOwner =
      (requesterRole === "PATIENT" && reservation.patientId === requesterId) ||
      (requesterRole === "PHARMACY" && reservation.pharmacyId === requesterId);
    if (!isOwner && requesterRole !== "ADMIN") throw ApiError.forbidden();

    return reservation;
  },

  async listForPatient(patientId: string) {
    return reservationRepository.findByPatient(patientId);
  },

  async listForPharmacy(pharmacyId: string, status?: ReservationStatus) {
    return reservationRepository.findByPharmacy(pharmacyId, status);
  },

  /** Pharmacy review: accept or reject a pending reservation. */
  async review(pharmacyId: string, reservationId: string, input: ReviewReservationInput) {
    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation) throw ApiError.notFound("Reservation not found");
    if (reservation.pharmacyId !== pharmacyId) throw ApiError.forbidden();
    if (reservation.status !== ReservationStatus.PENDING) {
      throw ApiError.conflict(`Reservation is already ${reservation.status}`);
    }

    const newStatus =
      input.decision === "ACCEPTED" ? ReservationStatus.ACCEPTED : ReservationStatus.REJECTED;
    const updated = await reservationRepository.updateStatus(reservationId, newStatus, input.note);

    await recordAudit({
      actorId: pharmacyId,
      actorType: "PHARMACY",
      action: `RESERVATION_${newStatus}`,
      entityType: "Reservation",
      entityId: reservationId,
    });

    await sendReservationStatusEmail(
      reservation.patient.email,
      newStatus,
      reservation.pharmacy.businessName
    );

    return updated;
  },

  /** Patient cancels their own pending/accepted reservation. */
  async cancel(patientId: string, reservationId: string) {
    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation) throw ApiError.notFound("Reservation not found");
    if (reservation.patientId !== patientId) throw ApiError.forbidden();
    if (![ReservationStatus.PENDING, ReservationStatus.ACCEPTED].includes(reservation.status)) {
      throw ApiError.conflict(`Reservation cannot be cancelled from status ${reservation.status}`);
    }

    const updated = await reservationRepository.updateStatus(reservationId, ReservationStatus.CANCELLED);

    await recordAudit({
      actorId: patientId,
      actorType: "PATIENT",
      action: "RESERVATION_CANCELLED",
      entityType: "Reservation",
      entityId: reservationId,
    });

    return updated;
  },

  /** Pharmacy marks an accepted reservation as completed (bought) and decrements stock. */
  async complete(pharmacyId: string, reservationId: string) {
    const reservation = await reservationRepository.findById(reservationId);
    if (!reservation) throw ApiError.notFound("Reservation not found");
    if (reservation.pharmacyId !== pharmacyId) throw ApiError.forbidden();
    if (reservation.status !== ReservationStatus.ACCEPTED) {
      throw ApiError.conflict("Only accepted reservations can be completed");
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const item of reservation.items) {
        const stock = await tx.stock.findUnique({
          where: { pharmacyId_medicineId: { pharmacyId, medicineId: item.medicineId } },
        });
        if (!stock || stock.quantity < item.quantity) {
          throw ApiError.conflict(`Stock changed since reservation; insufficient quantity for ${item.medicineId}`);
        }
        await tx.stock.update({
          where: { id: stock.id },
          data: { quantity: { decrement: item.quantity } },
        });
      }
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.COMPLETED, reviewedAt: new Date() },
      });
    });

    await recordAudit({
      actorId: pharmacyId,
      actorType: "PHARMACY",
      action: "RESERVATION_COMPLETED",
      entityType: "Reservation",
      entityId: reservationId,
    });

    return reservationRepository.findById(reservationId);
  },

  /** Background job entry point: automatic expiration of stale pending reservations. */
  async expireStalePending() {
    const stale = await reservationRepository.findExpiredPending();
    if (stale.length === 0) return { expiredCount: 0 };

    await reservationRepository.bulkExpire(stale.map((r: { id: string }) => r.id));

    for (const r of stale as Array<{ id: string }>) {
      await recordAudit({
        actorType: "SYSTEM",
        action: "RESERVATION_AUTO_EXPIRED",
        entityType: "Reservation",
        entityId: r.id,
      });
    }

    logger.info(`Auto-expired ${stale.length} stale pending reservations`);
    return { expiredCount: stale.length };
  },
};
