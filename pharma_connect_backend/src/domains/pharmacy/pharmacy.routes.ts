import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { uploadLicense } from "../../middleware/upload.middleware";
import { pharmacyController } from "./pharmacy.controller";
import { loginPharmacySchema, registerPharmacySchema } from "./pharmacy.schema";
import { verifyEmailSchema } from "../patient/patient.schema";

const router = Router();

router.post("/register", validate({ body: registerPharmacySchema }), asyncHandler(pharmacyController.register));
router.post("/verify-email", validate({ body: verifyEmailSchema }), asyncHandler(pharmacyController.verifyEmail));
router.post("/login", validate({ body: loginPharmacySchema }), asyncHandler(pharmacyController.login));

router.get("/me", requireAuth, requireRole("PHARMACY"), asyncHandler(pharmacyController.getProfile));
router.delete("/me", requireAuth, requireRole("PHARMACY"), asyncHandler(pharmacyController.deleteAccount));
router.post(
  "/me/license",
  requireAuth,
  requireRole("PHARMACY"),
  uploadLicense.single("license"),
  asyncHandler(pharmacyController.uploadLicense)
);

export default router;
