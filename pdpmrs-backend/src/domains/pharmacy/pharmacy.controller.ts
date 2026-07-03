import { Request, Response } from "express";
import { ok } from "../../common/response";
import { ApiError } from "../../common/ApiError";
import { pharmacyService } from "./pharmacy.service";

export const pharmacyController = {
  register: async (req: Request, res: Response) => {
    const result = await pharmacyService.register(req.body);
    ok(res, result, 201);
  },

  verifyEmail: async (req: Request, res: Response) => {
    const result = await pharmacyService.verifyEmail(req.body.token);
    ok(res, result);
  },

  login: async (req: Request, res: Response) => {
    const result = await pharmacyService.login(req.body);
    ok(res, result);
  },

  uploadLicense: async (req: Request, res: Response) => {
    if (!req.file) throw ApiError.badRequest("License document file is required");
    const result = await pharmacyService.uploadLicense(req.user!.sub, req.file.path);
    ok(res, result, 201);
  },

  getProfile: async (req: Request, res: Response) => {
    const result = await pharmacyService.getProfile(req.user!.sub);
    ok(res, result);
  },

  deleteAccount: async (req: Request, res: Response) => {
    const result = await pharmacyService.deleteAccount(req.user!.sub);
    ok(res, result);
  },
};
