"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { locationApi, reservationApi } from "@/lib/domains";
import { PharmacyNearby } from "@/lib/types";
import { ApiClientError } from "@/lib/api-client";
import { Banner } from "@/components/Banner";
import { RequireRole } from "@/components/RequireRole";
import { EmptyState } from "@/components/EmptyState";

function NewReservationInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const medicineId = searchParams.get("medicineId") ?? "";
  const medicineName = searchParams.get("name") ?? "this medicine";

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [pharmacies, setPharmacies] = useState<PharmacyNearby[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Your browser doesn\u2019t support location sharing. Enter your pharmacy manually instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError("Location access was denied. Allow location access to see nearby pharmacies.")
    );
  }, []);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    locationApi
      .nearby(coords.lat, coords.lng, 15)
      .then(setPharmacies)
      .catch(() => setLocationError("Couldn\u2019t load nearby pharmacies."))
      .finally(() => setLoading(false));
  }, [coords]);

  async function handleSubmit() {
    if (!selectedPharmacyId) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const reservation = await reservationApi.create({
        pharmacyId: selectedPharmacyId,
        items: [{ medicineId, quantity }],
      });
      router.push(`/reservations?created=${reservation.id}`);
    } catch (err) {
      setSubmitError(
        err instanceof ApiClientError ? err.message : "Couldn\u2019t create the reservation. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Reserve {medicineName}</h1>
      <p className="mt-1 text-sm text-ink/60">
        Choose a pharmacy near you. They&rsquo;ll confirm they have it in stock before you go.
      </p>

      <div className="mt-6">
        <label className="label">Quantity</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          className="input w-32"
        />
      </div>

      <div className="mt-8">
        {locationError && <Banner tone="info">{locationError}</Banner>}
        {loading && <p className="text-sm text-ink/50">Finding pharmacies near you&hellip;</p>}

        {!loading && coords && pharmacies.length === 0 && !locationError && (
          <EmptyState
            title="No pharmacies found nearby"
            description="Try again later, or widen your search radius from a larger city center."
          />
        )}

        <div className="mt-4 space-y-3">
          {pharmacies.map((p) => (
            <label
              key={p.id}
              className={`card flex cursor-pointer items-center justify-between transition-colors ${
                selectedPharmacyId === p.id ? "ring-2 ring-teal-600" : ""
              }`}
            >
              <div>
                <p className="font-semibold text-teal-900">{p.businessName}</p>
                <p className="text-sm text-ink/50">{p.distanceKm} km away</p>
              </div>
              <input
                type="radio"
                name="pharmacy"
                checked={selectedPharmacyId === p.id}
                onChange={() => setSelectedPharmacyId(p.id)}
                className="h-4 w-4 accent-teal-700"
              />
            </label>
          ))}
        </div>
      </div>

      {submitError && (
        <div className="mt-6">
          <Banner tone="error">{submitError}</Banner>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedPharmacyId || submitting}
        className="btn-accent mt-8 w-full"
      >
        {submitting ? "Submitting\u2026" : "Send reservation request"}
      </button>
    </div>
  );
}

export default function NewReservationPage() {
  return (
    <RequireRole role="PATIENT">
      <Suspense fallback={null}>
        <NewReservationInner />
      </Suspense>
    </RequireRole>
  );
}
