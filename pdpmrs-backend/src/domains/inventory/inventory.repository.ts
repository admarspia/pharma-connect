import { prisma } from "../../config/db";

export const inventoryRepository = {
  upsertStock: (pharmacyId: string, medicineId: string, quantity: number, price?: number, lowStockThreshold?: number) =>
    prisma.stock.upsert({
      where: { pharmacyId_medicineId: { pharmacyId, medicineId } },
      update: { quantity, ...(price !== undefined ? { price } : {}), ...(lowStockThreshold !== undefined ? { lowStockThreshold } : {}) },
      create: {
        pharmacyId,
        medicineId,
        quantity,
        price: price ?? 0,
        lowStockThreshold: lowStockThreshold ?? 5,
      },
    }),

  updateStock: (id: string, pharmacyId: string, data: { quantity?: number; price?: number; lowStockThreshold?: number }) =>
    prisma.stock.updateMany({ where: { id, pharmacyId }, data }),

  removeStock: (id: string, pharmacyId: string) => prisma.stock.deleteMany({ where: { id, pharmacyId } }),

  findByPharmacy: (pharmacyId: string) =>
    prisma.stock.findMany({ where: { pharmacyId }, include: { medicine: true } }),

  findOne: (id: string) => prisma.stock.findUnique({ where: { id }, include: { medicine: true, pharmacy: true } }),

  // Comparing two columns (quantity <= lowStockThreshold) isn't expressible
  // through the Prisma query builder, so this uses a raw SQL query instead.
  findLowStock: (pharmacyId: string) =>
    prisma.$queryRaw<
      Array<{ id: string; medicineId: string; quantity: number; lowStockThreshold: number }>
    >`
      SELECT id, "medicineId", quantity, "lowStockThreshold"
      FROM stocks
      WHERE "pharmacyId" = ${pharmacyId} AND quantity <= "lowStockThreshold"
      ORDER BY quantity ASC
    `,

  decrementQuantity: (id: string, amount: number) =>
    prisma.stock.update({ where: { id }, data: { quantity: { decrement: amount } } }),
};
