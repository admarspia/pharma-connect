import { prisma } from "../../config/db";
import { PrescriptionStatus } from "@prisma/client";

export const prescriptionRepository = {
  create: (patientId: string, fileUrl: string) =>
    prisma.prescription.create({ data: { patientId, fileUrl, status: PrescriptionStatus.UPLOADED } }),

  saveAnalysis: (
    id: string,
    data: { ocrText: string; extractedMedicines: unknown; score: unknown; confidence: number }
  ) =>
    prisma.prescription.update({
      where: { id },
      data: {
        ocrText: data.ocrText,
        extractedMedicines: data.extractedMedicines as any,
        score: data.score as any,
        confidence: data.confidence,
        status: PrescriptionStatus.ANALYZED,
        processedAt: new Date(),
      },
    }),

  markFailed: (id: string) =>
    prisma.prescription.update({ where: { id }, data: { status: PrescriptionStatus.FAILED } }),

  findById: (id: string) => prisma.prescription.findUnique({ where: { id } }),

  findByPatient: (patientId: string) =>
    prisma.prescription.findMany({ where: { patientId }, orderBy: { createdAt: "desc" } }),
};
