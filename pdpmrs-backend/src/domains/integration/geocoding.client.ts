import axios from "axios";
import { env } from "../../config/env";
import { logger } from "../../common/logger";
import { ApiError } from "../../common/ApiError";

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  confidence: number;
}

/**
 * Address validation via geocoding (scope: "address validation
 * (geocoding-based verification)"). Defaults to the Nominatim
 * (OpenStreetMap) public API; swap GEOCODING_BASE_URL / API key for
 * a commercial provider (Google, Mapbox) in production.
 */
export async function geocodeAddress(query: string): Promise<GeocodeResult> {
  try {
    const { data } = await axios.get(`${env.integrations.geocodingBaseUrl}/search`, {
      params: { q: query, format: "json", limit: 1 },
      headers: { "User-Agent": "PDPMRS/1.0" },
      timeout: env.ai.requestTimeoutMs,
    });

    if (!Array.isArray(data) || data.length === 0) {
      throw ApiError.badRequest("Address could not be verified");
    }

    const best = data[0];
    return {
      latitude: parseFloat(best.lat),
      longitude: parseFloat(best.lon),
      formattedAddress: best.display_name,
      confidence: best.importance ? Math.min(100, Math.round(best.importance * 100)) : 50,
    };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    logger.warn("Geocoding service call failed", { error: (err as Error).message });
    throw ApiError.internal("Geocoding service unavailable", { service: "geocoding" });
  }
}
