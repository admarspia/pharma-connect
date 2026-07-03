import { completeJson } from "../intelligence/llm.client";
import { translateText } from "../intelligence/translation.client";

const TRANSLITERATION_SYSTEM_PROMPT = `You generate likely Latin-script
transliteration variants for a medicine search query that may have been
typed phonetically in a non-Latin script or as a romanized approximation
(e.g. Amharic, Arabic). Respond ONLY with strict JSON:
{ "variants": string[] }
Return up to 5 plausible variants, most likely first.`;

export const languageService = {
  /**
   * Produces phonetic/transliteration variants of a search query so the
   * medicine search can match names typed in a different script or a
   * romanized approximation of a local-language name.
   */
  async getTransliterationVariants(query: string): Promise<string[]> {
    try {
      const result = await completeJson<{ variants: string[] }>(
        TRANSLITERATION_SYSTEM_PROMPT,
        query
      );
      return [query, ...(result.variants ?? [])];
    } catch {
      // Language assistance is optional (CON-019); fall back to the raw query.
      return [query];
    }
  },

  async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    return translateText(text, sourceLang, targetLang);
  },
};
