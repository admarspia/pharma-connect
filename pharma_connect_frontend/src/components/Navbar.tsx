"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const PATIENT_LINKS = [
  { href: "/medicines", label: "Search medicines" },
  { href: "/prescriptions", label: "Prescriptions" },
  { href: "/reservations", label: "My reservations" },
];

const PHARMACY_LINKS = [
  { href: "/pharmacy/dashboard", label: "Dashboard" },
  { href: "/pharmacy/stock", label: "Stock" },
  { href: "/pharmacy/reservations", label: "Reservations" },
  { href: "/pharmacy/license", label: "License" },
];

const ADMIN_LINKS = [{ href: "/admin/dashboard", label: "Admin dashboard" }];

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const links = user?.role === "PHARMACY" ? PHARMACY_LINKS : user?.role === "ADMIN" ? ADMIN_LINKS : PATIENT_LINKS;

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-teal-900/8 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-xl font-semibold text-teal-900">
          PDPMRS
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-teal-700 ${
                pathname === link.href ? "text-teal-900" : "text-ink/60"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-ink/60 sm:inline">{user.displayName}</span>
              <button onClick={handleLogout} className="btn-ghost !px-4 !py-2">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost !px-4 !py-2">
                Log in
              </Link>
              <Link href="/register" className="btn-accent !px-4 !py-2">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
