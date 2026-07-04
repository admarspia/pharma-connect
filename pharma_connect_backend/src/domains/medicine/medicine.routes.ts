import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { medicineController } from "./medicine.controller";

const router = Router();

router.get("/search", asyncHandler(medicineController.search));
router.get("/:id", asyncHandler(medicineController.getDetail));
router.post("/sync", requireAuth, requireRole("ADMIN"), asyncHandler(medicineController.sync));

export default router;
