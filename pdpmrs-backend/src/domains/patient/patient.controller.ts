import { Request, Response } from "express";
import { ok } from "../../common/response";
import { patientService } from "./patient.service";

export const patientController = {
  register: async (req: Request, res: Response) => {
    const result = await patientService.register(req.body);
    ok(res, result, 201);
  },

  verifyEmail: async (req: Request, res: Response) => {
    const result = await patientService.verifyEmail(req.body.token);
    ok(res, result);
  },

  login: async (req: Request, res: Response) => {
    const result = await patientService.login(req.body);
    ok(res, result);
  },

  getProfile: async (req: Request, res: Response) => {
    const result = await patientService.getProfile(req.user!.sub);
    ok(res, result);
  },

  deleteAccount: async (req: Request, res: Response) => {
    const result = await patientService.deleteAccount(req.user!.sub);
    ok(res, result);
  },
};
