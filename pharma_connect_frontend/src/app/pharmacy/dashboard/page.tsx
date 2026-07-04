"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pharmacyApi, inventoryApi, reservationApi } from "@/lib/domains";
import { PharmacyProfile, Stock, Reservation } from "@/lib/types";
import { RequireRole } from "@/components/RequireRole";
import { StatusPill } from "@/components/StatusPill";
import { Banner } from "@/components/Banner";

const LICENSE_COPY: Record<PharmacyProfile["licenseStatus"], { tone: "info" | "success" | "error"; text: string }> = {
  PENDING: { tone: "info", text: "Your license is awaiting administrator review." },
  APPROVED: { tone: "success", text: "Your license is approved. You\u2019re visible to patients." },
  REJECTED: { tone: "error", text: "Your license was rejected. Please upload a corrected document." },
  SUSPENDED: { tone: "error", text: "Your account is suspended. Contact platform support." },
};

function DashboardInner() {
  const [profile, setProfile] = useState<PharmacyProfile | null>(null);
  const [lowStock, setLowStock] = useState<Stock[]>([]);
  const [pending, setPending] = useState<Reservation[]>([]);

  useEffect(() => {
    pharmacyApi.me().then(setProfile);
    inventoryApi.lowStock().then(setLowStock);
    reservationApi.listMine("PENDING").then(setPending);
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold">{profile?.businessName ?? "Dashboard"}</h1>

      {profile && (
        <div className="mt-4">
          <Banner tone={LICENSE_COPY[profile.licenseStatus].tone}>
            {LICENSE_COPY[profile.licenseStatus].text}
            {profile.licenseStatus !== "APPROVED" && (
              <>
                {" "}
                <Link href="/pharmacy/license" className="font-semibold underline">
                  Manage license
                </Link>
              </>
            )}
          </Banner>
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-teal-900">Pending reservations</h2>
            <Link href="/pharmacy/reservations" className="text-xs font-medium text-teal-700">
              View all
            </Link>
          </div>
          {pending.length === 0 ? (
            <p className="mt-3 text-sm text-ink/50">Nothing waiting on you right now.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {pending.slice(0, 4).map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <span>{r.patient?.fullName ?? "Patient"}</span>
                  <StatusPill status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-teal-900">Low stock alerts</h2>
            <Link href="/pharmacy/stock" className="text-xs font-medium text-teal-700">
              Manage stock
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-ink/50">All stock levels look healthy.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {lowStock.slice(0, 4).map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span>{s.medicine.name}</span>
                  <span className="font-semibold text-clay-600">{s.quantity} left</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default function PharmacyDashboardPage() {
  return (
    <RequireRole role="PHARMACY">
      <DashboardInner />
    </RequireRole>
  );
}
