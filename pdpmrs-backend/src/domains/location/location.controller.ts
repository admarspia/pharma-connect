import { Request, Response } from "express";
import { ok } from "../../common/response";
import { locationService } from "./location.service";

export const locationController = {
  nearby: async (req: Request, res: Response) => {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 10;

    const results = await locationService.findNearbyPharmacies(lat, lng, radiusKm);
    ok(res, results);
  },
};
