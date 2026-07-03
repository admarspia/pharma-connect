import { Request, Response } from "express";
import { ok } from "../../common/response";
import { reservationService } from "./reservation.service";
import { ReservationStatus } from "@prisma/client";

export const reservationController = {
  create: async (req: Request, res: Response) => {
    const result = await reservationService.create(req.user!.sub, req.body);
    ok(res, result, 201);
  },

  getOne: async (req: Request, res: Response) => {
    const result = await reservationService.getById(req.params.id, req.user!.sub, req.user!.role);
    ok(res, result);
  },

  listMine: async (req: Request, res: Response) => {
    const result =
      req.user!.role === "PATIENT"
        ? await reservationService.listForPatient(req.user!.sub)
        : await reservationService.listForPharmacy(
            req.user!.sub,
            req.query.status as ReservationStatus | undefined
          );
    ok(res, result);
  },

  review: async (req: Request, res: Response) => {
    const result = await reservationService.review(req.user!.sub, req.params.id, req.body);
    ok(res, result);
  },

  cancel: async (req: Request, res: Response) => {
    const result = await reservationService.cancel(req.user!.sub, req.params.id);
    ok(res, result);
  },

  complete: async (req: Request, res: Response) => {
    const result = await reservationService.complete(req.user!.sub, req.params.id);
    ok(res, result);
  },
};
