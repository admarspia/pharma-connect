import { Request, Response } from "express";
import { Router } from "express";
import { ok } from "../../common/response";
import { ApiError } from "../../common/ApiError";
import { asyncHandler } from "../../common/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { uploadPrescription } from "../../middleware/upload.middleware";
import { prescriptionService } from "./prescription.service";

const prescriptionController = {
  upload: async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest("Prescription file is required");
    const result = await prescriptionService.uploadAndAnalyze(req.user!.sub, req.file.path);
    ok(res, result, 201);
  },

  getOne: async (req: Request, res: Response) => {
    const result = await prescriptionService.getById(req.params.id, req.user!.sub);
    ok(res, result);
  },

  listMine: async (req: Request, res: Response) => {
    const result = await prescriptionService.listForPatient(req.user!.sub);
    ok(res, result);
  },
};

const router = Router();
router.use(requireAuth, requireRole("PATIENT"));

router.post("/", uploadPrescription.single("prescription"), asyncHandler(prescriptionController.upload));
router.get("/", asyncHandler(prescriptionController.listMine));
router.get("/:id", asyncHandler(prescriptionController.getOne));

export default router;
