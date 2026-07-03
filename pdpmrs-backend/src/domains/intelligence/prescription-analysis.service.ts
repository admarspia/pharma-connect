import { runOcr } from "./ocr.client";
import { completeJson } from "./llm.client";
import { logger } from "../../common/logger";

export interface ExtractedMedicineEntry {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  confidence: number;
}

export interface PrescriptionAnalysisResult {
  ocrText: string;
  ocrConfidence: number;
  extractedMedicines: ExtractedMedicineEntry[];
  score: {
    clarity: number; // 0-100, how legible/parseable the source text was
    completeness: number; // 0-100, how many expected fields were found
    overallConfidence: number; // 0-100
  };
}

const EXTRACTION_SYSTEM_PROMPT = `You are a clinical prescription parsing assistant.
You extract structured medicine information from raw OCR text of a
prescription. You are a decision-support tool only: you never approve,
reject, or dispense anything (CON-010). Respond ONLY with strict JSON
matching this shape:
{
  "medicines": [
    { "name": string, "dosage": string|null, "frequency": string|null, "duration": string|null, "confidence": number }
  ],
  "clarity": number,
  "completeness": number
}
"confidence", "clarity" and "completeness" are 0-100 integers.
If the text is illegible or not a prescription, return an empty medicines array
and low clarity/completeness scores.`;

/**
 * Full prescription pipeline: OCR -> structured extraction -> scoring.
 * This is decision-support only; a pharmacy/patient still confirms the
 * reservation contents (CON-010, AI Independence principle).
 */
export async function analyzePrescription(filePath: string): Promise<PrescriptionAnalysisResult> {
  const ocr = await runOcr(filePath);

  if (!ocr.fullText.trim()) {
    logger.info("OCR produced no text, skipping LLM extraction");
    return {
      ocrText: "",
      ocrConfidence: 0,
      extractedMedicines: [],
      score: { clarity: 0, completeness: 0, overallConfidence: 0 },
    };
  }

  const extraction = await completeJson<{
    medicines: ExtractedMedicineEntry[];
    clarity: number;
    completeness: number;
  }>(EXTRACTION_SYSTEM_PROMPT, ocr.fullText);

  const overallConfidence = Math.round(
    (ocr.meanConfidence * 100 * 0.4 + extraction.clarity * 0.3 + extraction.completeness * 0.3)
  );

  return {
    ocrText: ocr.fullText,
    ocrConfidence: ocr.meanConfidence,
    extractedMedicines: extraction.medicines ?? [],
    score: {
      clarity: extraction.clarity ?? 0,
      completeness: extraction.completeness ?? 0,
      overallConfidence,
    },
  };
}
