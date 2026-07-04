"use client";

import { useEffect, useState } from "react";
import { reservationApi } from "@/lib/domains";
import { Reservation, ReservationStatus } from "@/lib/types";
import { RequireRole } from "@/components/RequireRole";
import { StatusPill } from "@/components/StatusPill";
import { Banner } from "@/components/Banner";
import { EmptyState } from "@/components/EmptyState";
import { ApiClientError } from "@/lib/api-client";

const FILTERS: Array<{ label: string; value: ReservationStatus | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Completed", value: "COMPLETED" },
];

function PharmacyReservationsInner() {
  const [filter, setFilter] = useState<ReservationStatus | "ALL">("PENDING");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    reservationApi
      .listMine(filter === "ALL" ? undefined : filter)
      .then(setReservations)
      .catch(() => setError("Couldn\u2019t load reservations."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [filter]);

  async function handleReview(id: string, decision: "ACCEPTED" | "REJECTED") {
    setBusyId(id);
    setError(null);
    try {
      await reservationApi.review(id, decision);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn\u2019t update this reservation.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleComplete(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await reservationApi.complete(id);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn\u2019t mark this as completed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Reservations</h1>

      <div className="mt-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value ? "bg-teal-700 text-cream" : "bg-teal-50 text-teal-700 hover:bg-teal-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-6">
          <Banner tone="error">{error}</Banner>
        </div>
      )}

      {loading && <p className="mt-8 text-sm text-ink/50">Loading&hellip;</p>}

      {!loading && reservations.length === 0 && (
        <div className="mt-8">
          <EmptyState title="Nothing here" description="Reservations matching this filter will show up here." />
        </div>
      )}

      <div className="mt-8 space-y-4">
        {reservations.map((r) => (
          <div key={r.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-teal-900">{r.patient?.fullName}</p>
                <p className="text-xs text-ink/40">{r.patient?.email}</p>
              </div>
              <StatusPill status={r.status} />
            </div>

            <ul className="mt-3 space-y-1 text-sm text-ink/70">
              {r.items.map((item) => (
                <li key={item.id}>
                  {item.quantity} \u00d7 {item.medicine.name}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex gap-2">
              {r.status === "PENDING" && (
                <>
                  <button
                    onClick={() => handleReview(r.id, "ACCEPTED")}
                    disabled={busyId === r.id}
                    className="btn-accent !px-4 !py-1.5 text-xs"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReview(r.id, "REJECTED")}
                    disabled={busyId === r.id}
                    className="btn-ghost !px-4 !py-1.5 text-xs"
                  >
                    Decline
                  </button>
                </>
              )}
              {r.status === "ACCEPTED" && (
                <button
                  onClick={() => handleComplete(r.id)}
                  disabled={busyId === r.id}
                  className="btn-accent !px-4 !py-1.5 text-xs"
                >
                  Mark picked up
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PharmacyReservationsPage() {
  return (
    <RequireRole role="PHARMACY">
      <PharmacyReservationsInner />
    </RequireRole>
  );
}
