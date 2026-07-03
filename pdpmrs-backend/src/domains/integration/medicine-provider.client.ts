import axios from "axios";
import { env } from "../../config/env";
import { logger } from "../../common/logger";
import { ApiError } from "../../common/ApiError";

export interface ExternalMedicine {
  externalId: string;
  name: string;
  genericName?: string;
  brandName?: string;
  category?: string;
  description?: string;
}

/**
 * Abstraction over the external medicine data provider (CON-020:
 * external APIs abstracted through an integration layer so the
 * provider can be swapped without touching business logic).
 */
export async function fetchMedicinesFromProvider(query: string): Promise<ExternalMedicine[]> {
  if (!env.integrations.medicineProviderBaseUrl) {
    logger.warn("MEDICINE_PROVIDER_BASE_URL not configured; returning empty result set");
    return [];
  }

  try {
    const { data } = await axios.get(`${env.integrations.medicineProviderBaseUrl}/medicines`, {
      params: { q: query },
      headers: { Authorization: `Bearer ${env.integrations.medicineProviderApiKey}` },
      timeout: env.ai.requestTimeoutMs,
    });
    return data.results as ExternalMedicine[];
  } catch (err) {
    logger.warn("Medicine provider call failed", { error: (err as Error).message });
    throw ApiError.internal("Medicine data provider unavailable", { service: "medicine-provider" });
  }
}
