import { pharmacyRepository } from "../pharmacy/pharmacy.repository";
import { geocodeAddress } from "../integration/geocoding.client";

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine great-circle distance in kilometers. */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export const locationService = {
  async validateAndGeocodeAddress(addressLine: string, city: string, country: string) {
    const query = `${addressLine}, ${city}, ${country}`;
    return geocodeAddress(query);
  },

  async findNearbyPharmacies(latitude: number, longitude: number, radiusKm = 10) {
    const candidates = await pharmacyRepository.findNearby(latitude, longitude, radiusKm);

    type Candidate = { id: string; businessName: string; latitude: number; longitude: number };
    type WithDistance = Candidate & { distanceKm: number };

    return (candidates as Candidate[])
      .map(
        (p): WithDistance => ({
          ...p,
          distanceKm: Number(
            haversineDistanceKm(latitude, longitude, p.latitude, p.longitude).toFixed(2)
          ),
        })
      )
      .filter((p: WithDistance) => p.distanceKm <= radiusKm)
      .sort((a: WithDistance, b: WithDistance) => a.distanceKm - b.distanceKm);
  },
};
