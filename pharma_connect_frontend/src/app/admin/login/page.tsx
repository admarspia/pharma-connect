"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/domains";
import { ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Banner } from "@/components/Banner";

export default function AdminLoginPage() {
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
      const { token, admin } = await adminApi.login(form);
      login(token, { id: admin.id, email: admin.email, role: "ADMIN", displayName: admin.fullName });
      router.push("/admin/dashboard");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold">Administrator login</h1>

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
    </div>
  );
}
