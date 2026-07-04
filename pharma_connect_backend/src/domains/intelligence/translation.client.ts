import axios from "axios";
import crypto from "crypto";
import { env } from "../../config/env";
import { cached } from "../../config/redis";
import { logger } from "../../common/logger";
import { ApiError } from "../../common/ApiError";

const TRANSLATION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days, translations are stable

// NLLB FLORES-200 language codes for languages this platform targets.
export const LANGUAGE_CODES: Record<string, string> = {
  en: "eng_Latn",
  am: "amh_Ethi",
  ar: "arb_Arab",
  fr: "fra_Latn",
  sw: "swh_Latn",
  om: "gaz_Latn", // Oromo
  ti: "tir_Ethi", // Tigrinya
};

function cacheKey(text: string, source: string, target: string) {
  const hash = crypto.createHash("sha1").update(text).digest("hex");
  return `translation:${source}:${target}:${hash}`;
}

/**
 * Calls the NLLB serving wrapper (docker/nllb). Results are cached in
 * Redis since translations of the same medicine text are requested
 * repeatedly (CON-003, scope: "medicine detail translation (cached results)").
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  if (!text.trim() || sourceLang === targetLang) return text;

  const src = LANGUAGE_CODES[sourceLang] ?? sourceLang;
  const tgt = LANGUAGE_CODES[targetLang] ?? targetLang;

  return cached(cacheKey(text, src, tgt), TRANSLATION_TTL_SECONDS, async () => {
    try {
      const { data } = await axios.post(
        env.ai.translationServiceUrl,
        { text, source_lang: src, target_lang: tgt },
        { timeout: env.ai.requestTimeoutMs }
      );
      return data.translation as string;
    } catch (err) {
      logger.warn("NLLB translation service call failed", { error: (err as Error).message });
      throw ApiError.internal("Translation service unavailable", { service: "nllb" });
    }
  });
}
