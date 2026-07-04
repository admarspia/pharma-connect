import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../common/asyncHandler";
import { validate } from "../../middleware/validate.middleware";
import { locationController } from "./location.controller";

const router = Router();

const nearbyQuerySchema = z.object({
  lat: z.string().regex(/^-?\d+(\.\d+)?$/),
  lng: z.string().regex(/^-?\d+(\.\d+)?$/),
  radiusKm: z.string().regex(/^\d+(\.\d+)?$/).optional(),
});

router.get("/pharmacies/nearby", validate({ query: nearbyQuerySchema }), asyncHandler(locationController.nearby));

export default router;
