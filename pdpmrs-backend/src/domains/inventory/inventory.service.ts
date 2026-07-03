import { ApiError } from "../../common/ApiError";
import { invalidate } from "../../config/redis";
import { inventoryRepository } from "./inventory.repository";
import { recordAudit } from "../administration/audit.service";
import { AddStockInput, UpdateStockInput } from "./inventory.schema";

export const inventoryService = {
  async addToStock(pharmacyId: string, input: AddStockInput) {
    const stock = await inventoryRepository.upsertStock(
      pharmacyId,
      input.medicineId,
      input.quantity,
      input.price,
      input.lowStockThreshold
    );
    await invalidate(`medicine:search:*`);
    await recordAudit({
      actorId: pharmacyId,
      actorType: "PHARMACY",
      action: "STOCK_ADDED",
      entityType: "Stock",
      entityId: stock.id,
      metadata: { medicineId: input.medicineId, quantity: input.quantity },
    });
    return stock;
  },

  async updateStock(pharmacyId: string, stockId: string, input: UpdateStockInput) {
    const result = await inventoryRepository.updateStock(stockId, pharmacyId, input);
    if (result.count === 0) throw ApiError.notFound("Stock entry not found for this pharmacy");

    await recordAudit({
      actorId: pharmacyId,
      actorType: "PHARMACY",
      action: "STOCK_UPDATED",
      entityType: "Stock",
      entityId: stockId,
      metadata: input,
    });
    return inventoryRepository.findOne(stockId);
  },

  async removeStock(pharmacyId: string, stockId: string) {
    const result = await inventoryRepository.removeStock(stockId, pharmacyId);
    if (result.count === 0) throw ApiError.notFound("Stock entry not found for this pharmacy");

    await recordAudit({
      actorId: pharmacyId,
      actorType: "PHARMACY",
      action: "STOCK_REMOVED",
      entityType: "Stock",
      entityId: stockId,
    });
    return { deleted: true };
  },

  async listStock(pharmacyId: string) {
    return inventoryRepository.findByPharmacy(pharmacyId);
  },

  async lowStockAlerts(pharmacyId: string) {
    return inventoryRepository.findLowStock(pharmacyId);
  },
};
