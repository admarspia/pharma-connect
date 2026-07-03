import { completeJson } from "./llm.client";

export interface NormalizationResult {
  normalizedGenericName: string;
  aliases: string[];
  confidence: number;
}

const NORMALIZATION_SYSTEM_PROMPT = `You normalize medicine names to support
brand <-> generic matching. Respond ONLY with strict JSON:
{ "normalizedGenericName": string, "aliases": string[], "confidence": number }
confidence is 0-100.`;

export async function normalizeMedicineName(rawName: string): Promise<NormalizationResult> {
  return completeJson<NormalizationResult>(NORMALIZATION_SYSTEM_PROMPT, rawName);
}
