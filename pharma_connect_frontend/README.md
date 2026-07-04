# PDPMRS Frontend

Next.js 14 (App Router, TypeScript, Tailwind) frontend for the Pharmacy
Discovery, Prescription Processing, and Medicine Reservation System. Built to
talk directly to [`pdpmrs-backend`](../pdpmrs-backend) — every function in
`src/lib/domains.ts` maps 1:1 to a backend route.

## Design system

- **Palette** — deep teal (`teal-900` #0B3B3C) as the primary/trust color,
  warm amber (`amber-500` #E8A33D) as the single accent for calls to action,
  a warm cream background rather than stark white. Carried forward from the
  earlier MedLex Ethiopia teal/amber system.
- **Type** — Fraunces for display headings (used sparingly), Inter for UI
  and body text, with Noto Sans Ethiopic layered in as a fallback so Amharic
  (\u12A0\u121B\u122D\u129B), Tigrinya, and other Ge'ez-script text render
  correctly wherever the API returns translated content.
- **Signature element** — the reservation `StatusPill` (`src/components/StatusPill.tsx`):
  one consistent color-coded lifecycle indicator (pending/accepted/rejected/
  cancelled/expired/completed) reused across the patient and pharmacy views,
  since the reservation lifecycle is the one piece of state every user type
  cares about.

## Structure

```
src/
  app/
    page.tsx                    landing page (hero search)
    (auth)/login, register, verify-email      patient auth
    medicines/, medicines/[id]/               search + detail
    prescriptions/                             upload + AI analysis view
    reservations/, reservations/new/           patient reservation flow
    pharmacy/login, register, dashboard,
             stock, reservations, license      pharmacy admin flows
    admin/login, dashboard                      platform administration
  components/                                   Navbar, StatusPill, RequireRole, Banner, EmptyState
  lib/
    api-client.ts     fetch wrapper, attaches JWT from localStorage
    domains.ts        one function per backend endpoint, grouped by domain
    auth-context.tsx  client-side session (token + role), persisted to localStorage
    types.ts          TypeScript types mirroring backend DTOs
```

## Getting started

```bash
cp .env.local.example .env.local
# edit NEXT_PUBLIC_API_BASE_URL if your backend isn't on localhost:4000
npm install
npm run dev
```

Requires the backend (and its Docker Compose stack) running — see
`pdpmrs-backend/README.md`.

## Auth model

JWTs are stored in `localStorage` and attached as `Authorization: Bearer` on
every request via `src/lib/api-client.ts`. `RequireRole` (a client component)
redirects unauthenticated or wrong-role visitors to the appropriate login
page. This is a scaffold-appropriate approach; for production hardening,
consider moving the token into an `httpOnly` cookie set by a Next.js Route
Handler proxying login, so the token isn't reachable from client-side JS.

## Known gaps / next steps

- **Stock-aware pharmacy picker**: the backend doesn't yet expose a "which
  pharmacies stock medicine X" endpoint, so `/reservations/new` lists nearby
  pharmacies by distance only; stock sufficiency is checked server-side when
  the reservation is submitted (the user gets a clear error if unavailable).
  Adding a combined search endpoint on the backend would let the frontend
  filter this list up front.
- **Email verification routing**: the backend's verification email doesn't
  indicate account type, so `/verify-email` tries the patient endpoint then
  falls back to the pharmacy endpoint. Passing `?role=` in the email link
  would be a cleaner fix on the backend side.
- **Admin account creation UI**: admins are seeded via the backend's Prisma
  seed script; there's no self-service admin signup page (intentionally —
  admin accounts shouldn't be publicly creatable).
- No test suite yet (unit/e2e).
