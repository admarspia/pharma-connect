import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { reservationController } from "./reservation.controller";
import { createReservationSchema, reviewReservationSchema } from "./reservation.schema";

const router = Router();

router.use(requireAuth);

router.get("/", requireRole("PATIENT", "PHARMACY"), asyncHandler(reservationController.listMine));
router.get("/:id", requireRole("PATIENT", "PHARMACY", "ADMIN"), asyncHandler(reservationController.getOne));

router.post(
  "/",
  requireRole("PATIENT"),
  validate({ body: createReservationSchema }),
  asyncHandler(reservationController.create)
);
router.post("/:id/cancel", requireRole("PATIENT"), asyncHandler(reservationController.cancel));

router.post(
  "/:id/review",
  requireRole("PHARMACY"),
  validate({ body: reviewReservationSchema }),
  asyncHandler(reservationController.review)
);
router.post("/:id/complete", requireRole("PHARMACY"), asyncHandler(reservationController.complete));

export default router;
