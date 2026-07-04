"use client";

import { useEffect, useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { medicineApi } from "@/lib/domains";
import { Medicine } from "@/lib/types";
import { EmptyState } from "@/components/EmptyState";
import { Banner } from "@/components/Banner";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "am", label: "\u12A0\u121B\u122D\u129B" },
  { code: "om", label: "Oromoo" },
  { code: "ti", label: "\u1275\u130D\u122D\u129B" },
];

function MedicineSearchInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [lang, setLang] = useState("en");
  const [results, setResults] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function runSearch(q: string, language: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await medicineApi.search(q.trim(), language);
      setResults(data);
      setSearched(true);
    } catch {
      setError("Couldn\u2019t load results right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialQuery) runSearch(initialQuery, lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    router.replace(`/medicines?q=${encodeURIComponent(query)}`);
    runSearch(query, lang);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Search medicines</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Medicine name, e.g. Paracetamol"
          className="input flex-1"
        />
        <select
          value={lang}
          onChange={(e) => {
            setLang(e.target.value);
            if (query.trim()) runSearch(query, e.target.value);
          }}
          className="input w-40"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-accent">
          Search
        </button>
      </form>

      <div className="mt-8">
        {error && <Banner tone="error">{error}</Banner>}

        {loading && <p className="text-sm text-ink/50">Searching&hellip;</p>}

        {!loading && searched && results.length === 0 && (
          <EmptyState
            title="No medicines found"
            description="Try a different spelling, the generic name, or search in another language."
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {results.map((m) => (
            <Link
              key={m.id}
              href={`/medicines/${m.id}?lang=${lang}`}
              className="card block transition-shadow hover:shadow-lg"
            >
              <h3 className="font-semibold text-teal-900">{m.translatedName ?? m.name}</h3>
              {m.genericName && <p className="mt-0.5 text-sm text-ink/50">{m.genericName}</p>}
              {m.category && (
                <span className="mt-2 inline-block rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                  {m.category}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MedicineSearchPage() {
  return (
    <Suspense fallback={null}>
      <MedicineSearchInner />
    </Suspense>
  );
}
