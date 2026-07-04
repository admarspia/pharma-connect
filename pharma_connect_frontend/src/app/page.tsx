"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/medicines?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-teal-900/8">
        <div
          className="absolute inset-0 -z-10 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #0B3B3C 1.5px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-amber-600">
            Find it. Reserve it. Skip the wait.
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Every nearby pharmacy&rsquo;s shelf,
            <br />
            searchable in one place.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-ink/60">
            Search a medicine by name, upload your prescription for AI-assisted reading, and reserve
            it at a pharmacy that actually has it in stock.
          </p>

          <form onSubmit={handleSearch} className="mx-auto mt-10 flex max-w-lg gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a medicine, e.g. Amoxicillin"
              className="input flex-1 !py-3 !text-base"
            />
            <button type="submit" className="btn-accent !px-6">
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-6 sm:grid-cols-3">
          <StepCard
            step="01"
            title="Upload your prescription"
            body="Our AI reads it, extracts each medicine, and flags anything unclear \u2014 you always confirm the details."
          />
          <StepCard
            step="02"
            title="See who has it, nearby"
            body="Search by name in your language and filter to pharmacies with real stock near you."
          />
          <StepCard
            step="03"
            title="Reserve, then pick up"
            body="Send a reservation request. The pharmacy confirms availability before you make the trip."
          />
        </div>
      </section>
    </div>
  );
}

function StepCard({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="card">
      <span className="font-display text-3xl text-amber-500">{step}</span>
      <h3 className="mt-3 text-lg font-semibold text-teal-900">{title}</h3>
      <p className="mt-2 text-sm text-ink/60">{body}</p>
    </div>
  );
}
