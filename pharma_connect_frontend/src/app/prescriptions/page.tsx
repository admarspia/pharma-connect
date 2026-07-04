"use client";

import { useEffect, useRef, useState } from "react";
import { prescriptionApi } from "@/lib/domains";
import { Prescription } from "@/lib/types";
import { Banner } from "@/components/Banner";
import { EmptyState } from "@/components/EmptyState";
import { RequireRole } from "@/components/RequireRole";
import { ApiClientError } from "@/lib/api-client";

const STATUS_LABEL: Record<Prescription["status"], string> = {
  UPLOADED: "Uploaded",
  PROCESSING: "Analyzing\u2026",
  ANALYZED: "Analyzed",
  FAILED: "Needs manual review",
  MANUAL_REVIEW: "Needs manual review",
};

function PrescriptionsInner() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    prescriptionApi
      .list()
      .then(setPrescriptions)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleUpload() {
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      await prescriptionApi.upload(file);
      if (fileInput.current) fileInput.current.value = "";
      load();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Couldn\u2019t upload this file. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Prescriptions</h1>
      <p className="mt-1 text-sm text-ink/60">
        Upload a photo or PDF of your prescription. Our AI reads it as decision support &mdash; you
        always confirm what goes into a reservation.
      </p>

      <div className="card mt-6 flex flex-wrap items-center gap-3">
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="text-sm"
        />
        <button onClick={handleUpload} disabled={uploading} className="btn-accent">
          {uploading ? "Uploading\u2026" : "Upload prescription"}
        </button>
      </div>

      {error && (
        <div className="mt-4">
          <Banner tone="error">{error}</Banner>
        </div>
      )}

      {loading && <p className="mt-8 text-sm text-ink/50">Loading&hellip;</p>}

      {!loading && prescriptions.length === 0 && (
        <div className="mt-8">
          <EmptyState
            title="No prescriptions yet"
            description="Upload one above to get an AI-assisted read of your medicines and dosages."
          />
        </div>
      )}

      <div className="mt-8 space-y-4">
        {prescriptions.map((p) => (
          <div key={p.id} className="card">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-ink/40">
                {new Date(p.createdAt).toLocaleString()}
              </p>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                {STATUS_LABEL[p.status]}
              </span>
            </div>

            {p.score && (
              <div className="mt-3 flex gap-4 text-xs text-ink/50">
                <span>Clarity: {p.score.clarity}%</span>
                <span>Completeness: {p.score.completeness}%</span>
                <span>Confidence: {p.score.overallConfidence}%</span>
              </div>
            )}

            {p.extractedMedicines && p.extractedMedicines.length > 0 && (
              <ul className="mt-3 space-y-1.5 border-t border-teal-900/8 pt-3 text-sm">
                {p.extractedMedicines.map((m, i) => (
                  <li key={i} className="flex justify-between text-ink/70">
                    <span>{m.name}</span>
                    <span className="text-ink/40">
                      {[m.dosage, m.frequency, m.duration].filter(Boolean).join(" \u00b7 ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {(p.status === "FAILED" || p.status === "MANUAL_REVIEW") && (
              <p className="mt-3 text-sm text-ink/50">
                We couldn&rsquo;t automatically read this file. It has been saved and can be reviewed
                manually &mdash; you can still reference it when creating a reservation.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PrescriptionsPage() {
  return (
    <RequireRole role="PATIENT">
      <PrescriptionsInner />
    </RequireRole>
  );
}
