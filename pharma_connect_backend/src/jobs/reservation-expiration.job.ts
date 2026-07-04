import cron from "node-cron";
import { env } from "../config/env";
import { logger } from "../common/logger";
import { reservationService } from "../domains/reservation/reservation.service";

/**
 * Scope: "automatic expiration handling (background job)". Runs on a
 * cron schedule (default every 10 minutes) and transitions any PENDING
 * reservation past its expiresAt into EXPIRED.
 */
export function startReservationExpirationJob() {
  cron.schedule(env.reservation.expirationJobCron, async () => {
    try {
      const { expiredCount } = await reservationService.expireStalePending();
      if (expiredCount > 0) {
        logger.info(`Reservation expiration job: expired ${expiredCount} reservations`);
      }
    } catch (err) {
      logger.error("Reservation expiration job failed", { error: (err as Error).message });
    }
  });

  logger.info(`Reservation expiration job scheduled: ${env.reservation.expirationJobCron}`);
}
