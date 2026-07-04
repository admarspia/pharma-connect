import { Request, Response } from "express";
import { ok } from "../../common/response";
import { inventoryService } from "./inventory.service";

export const inventoryController = {
  add: async (req: Request, res: Response) => {
    const result = await inventoryService.addToStock(req.user!.sub, req.body);
    ok(res, result, 201);
  },

  update: async (req: Request, res: Response) => {
    const result = await inventoryService.updateStock(req.user!.sub, req.params.id, req.body);
    ok(res, result);
  },

  remove: async (req: Request, res: Response) => {
    const result = await inventoryService.removeStock(req.user!.sub, req.params.id);
    ok(res, result);
  },

  list: async (req: Request, res: Response) => {
    const result = await inventoryService.listStock(req.user!.sub);
    ok(res, result);
  },

  lowStock: async (req: Request, res: Response) => {
    const result = await inventoryService.lowStockAlerts(req.user!.sub);
    ok(res, result);
  },
};
