"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Role } from "@/lib/types";

export function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role !== role) {
      const loginPath = role === "PHARMACY" ? "/pharmacy/login" : role === "ADMIN" ? "/admin/login" : "/login";
      router.replace(loginPath);
    }
  }, [loading, user, role, router]);

  if (loading || user?.role !== role) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 text-center text-ink/50">
        Checking your session&hellip;
      </div>
    );
  }

  return <>{children}</>;
}
