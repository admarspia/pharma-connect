import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { patientController } from "./patient.controller";
import { loginPatientSchema, registerPatientSchema, verifyEmailSchema } from "./patient.schema";

const router = Router();

router.post("/register", validate({ body: registerPatientSchema }), asyncHandler(patientController.register));
router.post("/verify-email", validate({ body: verifyEmailSchema }), asyncHandler(patientController.verifyEmail));
router.post("/login", validate({ body: loginPatientSchema }), asyncHandler(patientController.login));

router.get("/me", requireAuth, requireRole("PATIENT"), asyncHandler(patientController.getProfile));
router.delete("/me", requireAuth, requireRole("PATIENT"), asyncHandler(patientController.deleteAccount));

export default router;
