import { runOcr } from "./ocr.client";
import { completeJson } from "./llm.client";

export interface LicenseAnalysisResult {
  extractedFields: {
    licenseNumber?: string;
    holderName?: string;
    issuingAuthority?: string;
    expiryDate?: string;
  };
  riskScore: number; // 0-100, higher = more concerning, review-support only
  consistencyIssues: string[];
  confidence: number;
}

const LICENSE_SYSTEM_PROMPT = `You analyze OCR text extracted from a pharmacy
license document. This output is REVIEW SUPPORT ONLY (CON-010) - a human
administrator makes the final approval decision. Respond ONLY with strict JSON:
{
  "extractedFields": { "licenseNumber": string|null, "holderName": string|null, "issuingAuthority": string|null, "expiryDate": string|null },
  "riskScore": number,
  "consistencyIssues": string[],
  "confidence": number
}
riskScore/confidence are 0-100. List consistencyIssues such as
missing fields, expired dates, or mismatched formatting.`;

export async function analyzeLicense(filePath: string): Promise<LicenseAnalysisResult> {
  const ocr = await runOcr(filePath);

  const result = await completeJson<LicenseAnalysisResult>(LICENSE_SYSTEM_PROMPT, ocr.fullText);

  return {
    extractedFields: result.extractedFields ?? {},
    riskScore: result.riskScore ?? 100,
    consistencyIssues: result.consistencyIssues ?? ["OCR/LLM analysis returned no data"],
    confidence: result.confidence ?? 0,
  };
}
