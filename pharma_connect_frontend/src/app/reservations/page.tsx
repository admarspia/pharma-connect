"use client";

import { useEffect, useState } from "react";
import { reservationApi } from "@/lib/domains";
import { Reservation } from "@/lib/types";
import { StatusPill } from "@/components/StatusPill";
import { EmptyState } from "@/components/EmptyState";
import { Banner } from "@/components/Banner";
import { RequireRole } from "@/components/RequireRole";
import Link from "next/link";
import { ApiClientError } from "@/lib/api-client";

function ReservationsInner() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    reservationApi
      .listMine()
      .then(setReservations)
      .catch(() => setError("Couldn\u2019t load your reservations."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCancel(id: string) {
    setActionError(null);
    try {
      await reservationApi.cancel(id);
      load();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Couldn\u2019t cancel this reservation.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold">My reservations</h1>

      {error && (
        <div className="mt-6">
          <Banner tone="error">{error}</Banner>
        </div>
      )}
      {actionError && (
        <div className="mt-6">
          <Banner tone="error">{actionError}</Banner>
        </div>
      )}

      {loading && <p className="mt-8 text-sm text-ink/50">Loading&hellip;</p>}

      {!loading && reservations.length === 0 && !error && (
        <div className="mt-8">
          <EmptyState
            title="No reservations yet"
            description="Search for a medicine and reserve it at a nearby pharmacy to see it here."
            action={
              <Link href="/medicines" className="btn-accent">
                Search medicines
              </Link>
            }
          />
        </div>
      )}

      <div className="mt-8 space-y-4">
        {reservations.map((r) => (
          <div key={r.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-teal-900">{r.pharmacy?.businessName}</p>
                <p className="mt-0.5 text-xs text-ink/40">
                  Requested {new Date(r.createdAt).toLocaleDateString()}
                </p>
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

            {r.reviewNote && <p className="mt-2 text-sm italic text-ink/50">&ldquo;{r.reviewNote}&rdquo;</p>}

            {["PENDING", "ACCEPTED"].includes(r.status) && (
              <button onClick={() => handleCancel(r.id)} className="btn-ghost mt-4 !px-4 !py-1.5 text-xs">
                Cancel reservation
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReservationsPage() {
  return (
    <RequireRole role="PATIENT">
      <ReservationsInner />
    </RequireRole>
  );
}
