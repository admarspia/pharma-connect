import { prisma } from "../../config/db";

export const medicineRepository = {
  findById: (id: string) =>
    prisma.medicine.findUnique({ where: { id }, include: { translations: true } }),

  findByExternalId: (externalId: string) => prisma.medicine.findUnique({ where: { externalId } }),

  upsertFromExternal: (data: {
    externalId: string;
    name: string;
    genericName?: string;
    brandName?: string;
    category?: string;
    description?: string;
    normalizedKey: string;
  }) =>
    prisma.medicine.upsert({
      where: { externalId: data.externalId },
      update: { ...data },
      create: { ...data, source: "external_api" },
    }),

  searchByName: (query: string, limit = 20) =>
    prisma.medicine.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { genericName: { contains: query, mode: "insensitive" } },
          { brandName: { contains: query, mode: "insensitive" } },
          { normalizedKey: { contains: query.toLowerCase(), mode: "insensitive" } },
        ],
      },
      take: limit,
    }),

  saveTranslation: (
    medicineId: string,
    languageCode: string,
    translatedName: string,
    translatedDescription?: string
  ) =>
    prisma.medicineTranslation.upsert({
      where: { medicineId_languageCode: { medicineId, languageCode } },
      update: { translatedName, translatedDescription },
      create: { medicineId, languageCode, translatedName, translatedDescription },
    }),

  findTranslation: (medicineId: string, languageCode: string) =>
    prisma.medicineTranslation.findUnique({
      where: { medicineId_languageCode: { medicineId, languageCode } },
    }),
};
