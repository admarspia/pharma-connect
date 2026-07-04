"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { pharmacyApi } from "@/lib/domains";
import { ApiClientError } from "@/lib/api-client";
import { Banner } from "@/components/Banner";

export default function PharmacyRegisterPage() {
  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    password: "",
    phone: "",
    addressLine: "",
    city: "",
    country: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await pharmacyApi.register(form);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-6 py-20">
        <Banner tone="success">
          Pharmacy account created. Check <strong>{form.email}</strong> to verify your email, then log in
          and upload your license to get approved.
        </Banner>
        <Link href="/pharmacy/login" className="btn-primary mt-6 w-full">
          Go to pharmacy login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-2xl font-semibold">List your pharmacy</h1>
      <p className="mt-1 text-sm text-ink/60">Reach more patients and manage reservations online.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && <Banner tone="error">{error}</Banner>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Business name</label>
            <input
              required
              className="input"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Owner name</label>
            <input
              required
              className="input"
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label">Email</label>
          <input
            required
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Phone (optional)</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Street address</label>
          <input
            required
            className="input"
            value={form.addressLine}
            onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">City</label>
            <input
              required
              className="input"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Country</label>
            <input
              required
              className="input"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label">Password</label>
          <input
            required
            minLength={8}
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account\u2026" : "Create pharmacy account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        Already registered?{" "}
        <Link href="/pharmacy/login" className="font-medium text-teal-700">
          Log in
        </Link>
      </p>
    </div>
  );
}
