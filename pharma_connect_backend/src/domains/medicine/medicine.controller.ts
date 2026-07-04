import { Request, Response } from "express";
import { ok } from "../../common/response";
import { medicineService } from "./medicine.service";

export const medicineController = {
  search: async (req: Request, res: Response) => {
    const query = (req.query.q as string) ?? "";
    const language = (req.query.lang as string) ?? "en";
    const results = await medicineService.search(query, language);
    ok(res, results);
  },

  getDetail: async (req: Request, res: Response) => {
    const language = (req.query.lang as string) ?? "en";
    const result = await medicineService.getTranslatedDetail(req.params.id, language);
    ok(res, result);
  },

  sync: async (req: Request, res: Response) => {
    const query = (req.query.q as string) ?? "";
    const result = await medicineService.syncFromProvider(query);
    ok(res, result, 201);
  },
};
