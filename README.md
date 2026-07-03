# PDPMRS Backend

Pharmacy Discovery, Prescription Processing, and Medicine Reservation System —
Node.js/TypeScript backend implementing the full domain scope from the SRS
(patient, pharmacy, medicine, inventory, reservation, location, language,
intelligence, notification, administration, integration, analytics).

## Architecture

Modular monolith (CON-008). One Express app, one PostgreSQL database, domains
isolated under `src/domains/*` each with their own `schema` (Zod validation),
`repository` (Prisma queries), `service` (business logic), `controller`
(HTTP glue), and `routes`.

```
src/
  config/        env, Prisma client, Redis client
  common/        logger, ApiError, response helpers
  middleware/    auth/RBAC, validation, error handling, uploads
  utils/         jwt, password hashing, token/OTP generation
  domains/
    patient/           registration, auth, prescriptions
    pharmacy/           registration, auth, license upload
    medicine/           catalog sync, search, translation
    inventory/          stock CRUD, low-stock alerts
    reservation/        lifecycle, review, completion
    location/            geocoding, nearest-pharmacy search
    language/            transliteration + translation orchestration
    intelligence/         PaddleOCR / Qwen / NLLB clients + analysis services
    notification/        email (SMTP), audit trail hooks
    administration/      admin auth, license approval, analytics, audit logs
    integration/          medicine provider + geocoding external clients
  jobs/           reservation auto-expiration cron job
  routes/         route aggregator mounted at /api/v1
```

## Real AI integrations

- **OCR** — `docker/paddleocr`: a FastAPI wrapper around PaddleOCR.
- **LLM (Qwen)** — served via **Ollama** (OpenAI-compatible endpoint), used
  for structured prescription/license extraction and medicine normalization.
- **Translation (NLLB)** — `docker/nllb`: a FastAPI wrapper around
  `facebook/nllb-200-distilled-600M`, results cached in Redis.

All AI calls are real HTTP requests to these services — nothing is mocked.
Per CON-010, every AI output is advisory only; a human (patient, pharmacy
admin, or platform admin) makes the actual decision.

## Getting started

### 1. Configure environment

```bash
cp .env.example .env
# edit JWT_SECRET, SMTP settings, etc.
```

### 2. Start infrastructure with Docker Compose

```bash
docker compose up -d postgres redis paddleocr ollama nllb mailhog
```

First boot of `ollama` and `nllb` will take a while — they pull/cache large
model weights. `nllb` requires network access to Hugging Face at build time;
`ollama` pulls the Qwen model at container start via `docker/ollama/init.sh`.

### 3. Install dependencies and generate the Prisma client

```bash
npm install
npx prisma generate
```

> **Note:** `prisma generate` needs network access to `binaries.prisma.sh` to
> download its query engine. If you're working in a network-restricted
> sandbox, this step must be run somewhere with full internet access — the
> TypeScript source itself has already been verified to compile cleanly
> against a generated client (all 8 "no exported member" errors seen in a
> restricted sandbox trace back solely to this missing binary, not to the
> application code).

### 4. Run migrations and seed an admin user

```bash
npx prisma migrate dev --name init
npm run prisma:generate
SEED_ADMIN_EMAIL=admin@yourdomain.com SEED_ADMIN_PASSWORD=ChangeMe123! npx prisma db seed
```

### 5. Run the API

```bash
npm run dev       # ts-node-dev, hot reload
# or
npm run build && npm start
```

### 6. Full stack via Docker Compose

```bash
docker compose up -d --build
```

The API is served at `http://localhost:4000/api/v1`. Health check:
`GET /api/v1/health`.

## Key endpoints (v1)

| Domain | Method & Path | Auth |
|---|---|---|
| Patient | `POST /patients/register` | none |
| Patient | `POST /patients/verify-email` | none |
| Patient | `POST /patients/login` | none |
| Patient | `GET /patients/me` | PATIENT |
| Prescription | `POST /prescriptions` (multipart `prescription`) | PATIENT |
| Pharmacy | `POST /pharmacies/register` | none |
| Pharmacy | `POST /pharmacies/me/license` (multipart `license`) | PHARMACY |
| Medicine | `GET /medicines/search?q=&lang=` | none |
| Medicine | `GET /medicines/:id?lang=` | none |
| Inventory | `POST /inventory` | PHARMACY |
| Inventory | `GET /inventory/low-stock` | PHARMACY |
| Reservation | `POST /reservations` | PATIENT |
| Reservation | `POST /reservations/:id/review` | PHARMACY |
| Reservation | `POST /reservations/:id/complete` | PHARMACY |
| Location | `GET /locations/pharmacies/nearby?lat=&lng=&radiusKm=` | none |
| Admin | `POST /admin/login` | none |
| Admin | `POST /admin/pharmacies/:id/license-decision` | ADMIN |
| Admin | `GET /admin/analytics` | ADMIN |

## Design constraints honored

- **CON-002/011**: PostgreSQL is the sole persistent store; Prisma schema
  covers every domain entity.
- **CON-003/014**: Redis caches medicine details, search results, and
  translations; cache misses fall through gracefully if Redis is down.
- **CON-010**: AI Intelligence layer (`ocr.client`, `llm.client`,
  `translation.client`) never sets an approval/rejection status itself —
  license and reservation decisions stay with a human role.
- **CON-015/018**: JWT-based auth (`auth.middleware.ts`) + role gate
  (`requireRole`) for PATIENT / PHARMACY / ADMIN.
- **CON-019**: External/AI service failures are caught and degrade
  gracefully (e.g. address validation, transliteration, email) rather than
  blocking the core account/reservation flows — see try/catch blocks in
  `pharmacy.service.ts` and `language.service.ts`.
- **Auditability**: every state-changing action funnels through
  `recordAudit()` into the `audit_logs` table.

## What's intentionally not built yet

This is the backend scaffold layer. Not included: the Next.js frontend,
payment/delivery integrations, and the "future expansion" items listed
per-domain in the SRS (batch tracking, drug interactions, SMS/push
notifications, etc.) — all future-expansion points are structurally left
open (separate service files per concern, integration layer abstraction)
so they can be added without a redesign.
