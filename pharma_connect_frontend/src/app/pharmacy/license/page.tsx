"use client";

import { useEffect, useRef, useState } from "react";
import { pharmacyApi } from "@/lib/domains";
import { PharmacyProfile } from "@/lib/types";
import { RequireRole } from "@/components/RequireRole";
import { Banner } from "@/components/Banner";
import { ApiClientError } from "@/lib/api-client";

const STATUS_COPY: Record<PharmacyProfile["licenseStatus"], { tone: "info" | "success" | "error"; text: string }> = {
  PENDING: { tone: "info", text: "Under review by our administration team." },
  APPROVED: { tone: "success", text: "Approved. Your pharmacy is visible to patients." },
  REJECTED: { tone: "error", text: "Rejected. Please upload a clearer or corrected document." },
  SUSPENDED: { tone: "error", text: "Suspended. Contact platform support for details." },
};

function LicenseInner() {
  const [profile, setProfile] = useState<PharmacyProfile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    pharmacyApi.me().then(setProfile);
  }, []);

  async function handleUpload() {
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(false);
    setUploading(true);
    try {
      await pharmacyApi.uploadLicense(file);
      setSuccess(true);
      const updated = await pharmacyApi.me();
      setProfile(updated);
      if (fileInput.current) fileInput.current.value = "";
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Couldn\u2019t upload this document. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Pharmacy license</h1>

      {profile && (
        <div className="mt-4">
          <Banner tone={STATUS_COPY[profile.licenseStatus].tone}>
            {STATUS_COPY[profile.licenseStatus].text}
          </Banner>
        </div>
      )}

      <div className="card mt-6">
        <label className="label">Upload license document (image or PDF)</label>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="text-sm"
        />
        <p className="mt-2 text-xs text-ink/40">
          Our AI performs an initial read of key fields as support for the human review that follows \u2014
          it does not itself approve or reject your license.
        </p>
        <button onClick={handleUpload} disabled={uploading} className="btn-accent mt-4">
          {uploading ? "Uploading\u2026" : "Upload document"}
        </button>

        {error && (
          <div className="mt-4">
            <Banner tone="error">{error}</Banner>
          </div>
        )}
        {success && (
          <div className="mt-4">
            <Banner tone="success">Document uploaded and queued for review.</Banner>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LicensePage() {
  return (
    <RequireRole role="PHARMACY">
      <LicenseInner />
    </RequireRole>
  );
}
