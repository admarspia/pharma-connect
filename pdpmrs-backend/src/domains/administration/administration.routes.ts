import { Request, Response, Router } from "express";
import { ok } from "../../common/response";
import { asyncHandler } from "../../common/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { administrationService } from "./administration.service";
import { adminLoginSchema, licenseDecisionSchema } from "./administration.schema";

const administrationController = {
  login: async (req: Request, res: Response) => {
    const result = await administrationService.login(req.body);
    ok(res, result);
  },

  pendingPharmacies: async (_req: Request, res: Response) => {
    const result = await administrationService.listPendingPharmacies();
    ok(res, result);
  },

  decideLicense: async (req: Request, res: Response) => {
    const result = await administrationService.decidePharmacyLicense(
      req.user!.sub,
      req.params.pharmacyId,
      req.body.decision
    );
    ok(res, result);
  },

  analytics: async (_req: Request, res: Response) => {
    const result = await administrationService.platformAnalytics();
    ok(res, result);
  },

  auditLogs: async (req: Request, res: Response) => {
    const result = await administrationService.listAuditLogs(req.query.entityType as string | undefined);
    ok(res, result);
  },
};

const router = Router();

router.post("/login", validate({ body: adminLoginSchema }), asyncHandler(administrationController.login));

router.use(requireAuth, requireRole("ADMIN"));
router.get("/pharmacies/pending", asyncHandler(administrationController.pendingPharmacies));
router.post(
  "/pharmacies/:pharmacyId/license-decision",
  validate({ body: licenseDecisionSchema }),
  asyncHandler(administrationController.decideLicense)
);
router.get("/analytics", asyncHandler(administrationController.analytics));
router.get("/audit-logs", asyncHandler(administrationController.auditLogs));

export default router;
