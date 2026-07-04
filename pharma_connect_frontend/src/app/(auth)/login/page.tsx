"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { patientApi } from "@/lib/domains";
import { ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Banner } from "@/components/Banner";

export default function PatientLoginPage() {
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
      const { token, patient } = await patientApi.login(form);
      login(token, { id: patient.id, email: patient.email, role: "PATIENT", displayName: patient.fullName });
      router.push("/medicines");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-ink/60">Log in to your patient account.</p>

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
        New here?{" "}
        <Link href="/register" className="font-medium text-teal-700">
          Create an account
        </Link>
      </p>
      <div className="mt-8 flex justify-center gap-4 text-xs text-ink/40">
        <Link href="/pharmacy/login" className="hover:text-teal-700">
          Pharmacy login
        </Link>
        <span>&middot;</span>
        <Link href="/admin/login" className="hover:text-teal-700">
          Admin login
        </Link>
      </div>
    </div>
  );
}
