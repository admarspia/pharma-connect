import { Router } from "express";
import { asyncHandler } from "../../common/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { inventoryController } from "./inventory.controller";
import { addStockSchema, updateStockSchema } from "./inventory.schema";

const router = Router();

router.use(requireAuth, requireRole("PHARMACY"));

router.get("/", asyncHandler(inventoryController.list));
router.get("/low-stock", asyncHandler(inventoryController.lowStock));
router.post("/", validate({ body: addStockSchema }), asyncHandler(inventoryController.add));
router.patch("/:id", validate({ body: updateStockSchema }), asyncHandler(inventoryController.update));
router.delete("/:id", asyncHandler(inventoryController.remove));

export default router;
