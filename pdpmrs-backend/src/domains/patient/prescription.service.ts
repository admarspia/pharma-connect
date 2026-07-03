import { ApiError } from "../../common/ApiError";
import { logger } from "../../common/logger";
import { prescriptionRepository } from "./prescription.repository";
import { analyzePrescription } from "../intelligence/prescription-analysis.service";
import { recordAudit } from "../administration/audit.service";

export const prescriptionService = {
  /**
   * Uploads a prescription and immediately runs it through the AI
   * pipeline. If the AI service is unavailable, the file is still
   * stored (AI-Limited Mode, section 6.3) and can be reviewed manually.
   */
  async uploadAndAnalyze(patientId: string, filePath: string) {
    const prescription = await prescriptionRepository.create(patientId, filePath);

    try {
      const analysis = await analyzePrescription(filePath);
      const updated = await prescriptionRepository.saveAnalysis(prescription.id, {
        ocrText: analysis.ocrText,
        extractedMedicines: analysis.extractedMedicines,
        score: analysis.score,
        confidence: analysis.score.overallConfidence,
      });

      await recordAudit({
        actorId: patientId,
        actorType: "PATIENT",
        action: "PRESCRIPTION_ANALYZED",
        entityType: "Prescription",
        entityId: prescription.id,
        metadata: { confidence: analysis.score.overallConfidence },
      });

      return updated;
    } catch (err) {
      logger.warn(`Prescription analysis failed for ${prescription.id}, marking for manual review`, {
        error: (err as Error).message,
      });
      await prescriptionRepository.markFailed(prescription.id);
      return prescriptionRepository.findById(prescription.id);
    }
  },

  async getById(id: string, patientId: string) {
    const prescription = await prescriptionRepository.findById(id);
    if (!prescription || prescription.patientId !== patientId) {
      throw ApiError.notFound("Prescription not found");
    }
    return prescription;
  },

  async listForPatient(patientId: string) {
    return prescriptionRepository.findByPatient(patientId);
  },
};
