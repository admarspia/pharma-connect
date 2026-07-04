import { ApiError } from "../../common/ApiError";
import { cached, invalidate } from "../../config/redis";
import { medicineRepository } from "./medicine.repository";
import { fetchMedicinesFromProvider } from "../integration/medicine-provider.client";
import { normalizeMedicineName } from "../intelligence/normalization.service";
import { languageService } from "../language/language.service";

const MEDICINE_CACHE_TTL_SECONDS = 60 * 60; // 1 hour, per scope: "caching frequently accessed medicines"
const SEARCH_CACHE_TTL_SECONDS = 60 * 15;

/** Pulls fresh data from the external provider and upserts the local catalog. */
async function syncFromProvider(query: string) {
  const externalResults = await fetchMedicinesFromProvider(query);

  const upserted = [];
  for (const item of externalResults) {
    const normalization = await normalizeMedicineName(item.name).catch(() => null);
    const medicine = await medicineRepository.upsertFromExternal({
      externalId: item.externalId,
      name: item.name,
      genericName: item.genericName ?? normalization?.normalizedGenericName,
      brandName: item.brandName,
      category: item.category,
      description: item.description,
      normalizedKey: (normalization?.normalizedGenericName ?? item.name).toLowerCase(),
    });
    upserted.push(medicine);
  }

  await invalidate("medicine:search:*");
  return upserted;
}

async function getById(id: string) {
  const medicine = await cached(`medicine:detail:${id}`, MEDICINE_CACHE_TTL_SECONDS, () =>
    medicineRepository.findById(id)
  );
  if (!medicine) throw ApiError.notFound("Medicine not found");
  return medicine;
}

/** Multilingual + phonetic search (scope: "multilingual medicine search"). */
async function search(query: string, language = "en") {
  const cacheKey = `medicine:search:${language}:${query.toLowerCase()}`;

  return cached(cacheKey, SEARCH_CACHE_TTL_SECONDS, async () => {
    const variants =
      language !== "en" ? await languageService.getTransliterationVariants(query) : [query];

    const resultSets = await Promise.all(variants.map((v) => medicineRepository.searchByName(v)));
    const merged = new Map(resultSets.flat().map((m) => [m.id, m]));
    return Array.from(merged.values());
  });
}

/** Translates and caches a medicine's display fields for a target language. */
async function getTranslatedDetail(medicineId: string, targetLang: string) {
  if (targetLang === "en") return getById(medicineId);

  const existing = await medicineRepository.findTranslation(medicineId, targetLang);
  if (existing) return existing;

  const medicine = (await getById(medicineId)) as { name: string; description: string | null };
  const translatedName = await languageService.translate(medicine.name, "en", targetLang);
  const translatedDescription = medicine.description
    ? await languageService.translate(medicine.description, "en", targetLang)
    : undefined;

  return medicineRepository.saveTranslation(medicineId, targetLang, translatedName, translatedDescription);
}

// Defined as standalone functions (rather than object-literal methods calling
// `this.x()`) to avoid TypeScript's self-referential inference limitations
// for circular `this` usage within a single object literal.
export const medicineService = { syncFromProvider, getById, search, getTranslatedDetail };
