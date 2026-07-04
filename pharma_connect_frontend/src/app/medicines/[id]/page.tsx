"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { medicineApi } from "@/lib/domains";
import { Medicine } from "@/lib/types";
import { Banner } from "@/components/Banner";
import { useAuth } from "@/lib/auth-context";

export default function MedicineDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") ?? "en";
  const router = useRouter();
  const { user } = useAuth();

  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    medicineApi
      .get(params.id, lang)
      .then(setMedicine)
      .catch(() => setError("This medicine couldn\u2019t be found."));
  }, [params.id, lang]);

  function handleReserve() {
    if (!user) {
      router.push(`/login?next=/medicines/${params.id}`);
      return;
    }
    router.push(`/reservations/new?medicineId=${params.id}&name=${encodeURIComponent(medicine?.name ?? "")}`);
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Banner tone="error">{error}</Banner>
        <Link href="/medicines" className="btn-ghost mt-6 inline-flex">
          Back to search
        </Link>
      </div>
    );
  }

  if (!medicine) {
    return <div className="mx-auto max-w-2xl px-6 py-16 text-ink/50">Loading&hellip;</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/medicines" className="text-sm text-teal-700">
        &larr; Back to search
      </Link>

      <h1 className="mt-4 text-3xl font-semibold">{medicine.translatedName ?? medicine.name}</h1>

      <div className="mt-2 flex flex-wrap gap-2">
        {medicine.genericName && (
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
            Generic: {medicine.genericName}
          </span>
        )}
        {medicine.brandName && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600">
            Brand: {medicine.brandName}
          </span>
        )}
        {medicine.category && (
          <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-medium text-ink/60">
            {medicine.category}
          </span>
        )}
      </div>

      {(medicine.translatedDescription ?? medicine.description) && (
        <p className="mt-6 text-sm leading-relaxed text-ink/70">
          {medicine.translatedDescription ?? medicine.description}
        </p>
      )}

      <button onClick={handleReserve} className="btn-accent mt-8">
        Reserve at a nearby pharmacy
      </button>
    </div>
  );
}
