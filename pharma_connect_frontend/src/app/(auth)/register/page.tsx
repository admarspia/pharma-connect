"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { patientApi } from "@/lib/domains";
import { ApiClientError } from "@/lib/api-client";
import { Banner } from "@/components/Banner";

export default function PatientRegisterPage() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await patientApi.register(form);
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
          Account created. Check <strong>{form.email}</strong> for a verification link before logging in.
        </Banner>
        <Link href="/login" className="btn-primary mt-6 w-full">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-ink/60">Search medicines and reserve them from nearby pharmacies.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && <Banner tone="error">{error}</Banner>}

        <div>
          <label className="label">Full name</label>
          <input
            required
            className="input"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
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
          <label className="label">Password</label>
          <input
            required
            minLength={8}
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <p className="mt-1 text-xs text-ink/40">At least 8 characters.</p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account\u2026" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-teal-700">
          Log in
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-ink/40">
        Run a pharmacy?{" "}
        <Link href="/pharmacy/register" className="font-medium text-teal-700">
          Register your pharmacy
        </Link>
      </p>
    </div>
  );
}
