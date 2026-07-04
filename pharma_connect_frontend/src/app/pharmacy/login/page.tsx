"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { pharmacyApi } from "@/lib/domains";
import { ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Banner } from "@/components/Banner";

export default function PharmacyLoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, pharmacy } = await pharmacyApi.login(form);
      login(token, {
        id: pharmacy.id,
        email: pharmacy.email,
        role: "PHARMACY",
        displayName: pharmacy.businessName,
      });
      router.push("/pharmacy/dashboard");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold">Pharmacy login</h1>
      <p className="mt-1 text-sm text-ink/60">Manage stock and reservations for your pharmacy.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && <Banner tone="error">{error}</Banner>}
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
          <label className="label">Password</label>
          <input
            required
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Logging in\u2026" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        New pharmacy?{" "}
        <Link href="/pharmacy/register" className="font-medium text-teal-700">
          Register here
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-ink/40">
        <Link href="/login" className="hover:text-teal-700">
          Patient login
        </Link>
      </p>
    </div>
  );
}
