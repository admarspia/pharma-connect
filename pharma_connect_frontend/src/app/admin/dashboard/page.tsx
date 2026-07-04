"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/domains";
import { PharmacyProfile, PlatformAnalytics } from "@/lib/types";
import { RequireRole } from "@/components/RequireRole";
import { Banner } from "@/components/Banner";
import { EmptyState } from "@/components/EmptyState";
import { ApiClientError } from "@/lib/api-client";

function AdminDashboardInner() {
  const [pending, setPending] = useState<PharmacyProfile[]>([]);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    adminApi.pendingPharmacies().then(setPending);
    adminApi.analytics().then(setAnalytics);
  }

  useEffect(load, []);

  async function handleDecision(pharmacyId: string, decision: "APPROVED" | "REJECTED") {
    setBusyId(pharmacyId);
    setError(null);
    try {
      await adminApi.decideLicense(pharmacyId, decision);
      load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn\u2019t record this decision.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Platform administration</h1>

      {analytics && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Patients" value={analytics.totalPatients} />
          <StatCard label="Pharmacies" value={analytics.totalPharmacies} />
          <StatCard label="Pending reservations" value={analytics.reservations.PENDING ?? 0} />
          <StatCard label="Low stock alerts" value={analytics.lowStockAlertCount} accent />
        </div>
      )}

      {error && (
        <div className="mt-6">
          <Banner tone="error">{error}</Banner>
        </div>
      )}

      <h2 className="mt-10 text-lg font-semibold text-teal-900">Pharmacies pending license review</h2>

      {pending.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Nothing pending" description="New pharmacy registrations will appear here for review." />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {pending.map((p) => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-teal-900">{p.businessName}</p>
                  <p className="text-sm text-ink/50">{p.ownerName}</p>
                  <p className="text-xs text-ink/40">
                    {p.addressLine}, {p.city}, {p.country}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    p.addressVerified ? "bg-sage-500/10 text-sage-600" : "bg-clay-500/10 text-clay-600"
                  }`}
                >
                  {p.addressVerified ? "Address verified" : "Address not verified"}
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleDecision(p.id, "APPROVED")}
                  disabled={busyId === p.id}
                  className="btn-accent !px-4 !py-1.5 text-xs"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleDecision(p.id, "REJECTED")}
                  disabled={busyId === p.id}
                  className="btn-ghost !px-4 !py-1.5 text-xs"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="card !p-4">
      <p className={`font-display text-2xl ${accent ? "text-clay-600" : "text-teal-900"}`}>{value}</p>
      <p className="mt-1 text-xs text-ink/50">{label}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <RequireRole role="ADMIN">
      <AdminDashboardInner />
    </RequireRole>
  );
}
