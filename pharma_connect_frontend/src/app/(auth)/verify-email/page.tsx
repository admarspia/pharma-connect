"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { patientApi, pharmacyApi } from "@/lib/domains";
import { Banner } from "@/components/Banner";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<"checking" | "success" | "error">("checking");

  useEffect(() => {
    if (!token) {
      setState("error");
      return;
    }

    // The verification link doesn't encode account type, so this tries the
    // patient endpoint first and falls back to the pharmacy endpoint.
    patientApi
      .verifyEmail(token)
      .then(() => setState("success"))
      .catch(() =>
        pharmacyApi
          .verifyEmail(token)
          .then(() => setState("success"))
          .catch(() => setState("error"))
      );
  }, [token]);

  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      {state === "checking" && <p className="text-ink/60">Verifying your email&hellip;</p>}

      {state === "success" && (
        <>
          <Banner tone="success">Your email has been verified. You can now log in.</Banner>
          <Link href="/login" className="btn-primary mt-6 w-full">
            Go to login
          </Link>
        </>
      )}

      {state === "error" && (
        <>
          <Banner tone="error">
            This verification link is invalid or has expired. Please register again or contact support.
          </Banner>
          <Link href="/register" className="btn-ghost mt-6 w-full">
            Back to registration
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
