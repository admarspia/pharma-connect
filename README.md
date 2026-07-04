# Pharma-Connect

**Pharmacy Discovery, Prescription Processing, and Medicine Reservation System**

A platform that lets patients search for medicines, get their prescriptions read
by an AI assistance layer, find nearby pharmacies that actually have stock, and
reserve medicines for pickup — while pharmacies manage inventory and
reservations, and platform administrators handle verification and oversight.

Built for the Ethiopian pharmacy context, with multilingual support for
English, Amharic, Oromoo, and Tigrinya.

---

## Repository layout

This project is split into two applications plus a requirements document:

```
pdpmrs/
├── pharma_connect_backend/     Node.js/TypeScript API, PostgreSQL, Redis, AI services
├── pharma_connect_frontend/    Next.js 14 web app (patient, pharmacy, admin)
└── docs/
    └── PDPMRS-SRS.docx Software Requirements Specification (ISO/IEC/IEEE 29148)
```

Each application has its own README with full setup instructions
([`pharma_connect_backend/README.md`](./pharma_connect_backend/README.md),
[`pharma_connect_frontend/README.md`](./pharma_connect_frontend/README.md)). This document
covers the project as a whole.

---

## What it does

| Domain | Capability |
|---|---|
| **Patient** | Register/verify/login, upload prescriptions, search medicines, reserve at a nearby pharmacy, track reservations |
| **Pharmacy** | Register/verify/login, upload license for review, manage stock, accept/decline/complete reservations |
| **Medicine catalog** | Synced from an external provider, cached in Redis, multilingual + phonetic search |
| **Reservations** | Full lifecycle (pending → accepted/rejected → completed, or cancelled/expired), automatic expiration via background job |
| **Location** | Geocoding-based address validation, distance-based nearby-pharmacy search |
| **AI Assistance Layer** | OCR (PaddleOCR) + structured extraction (Qwen) for prescriptions and licenses, translation (NLLB) for medicine data — all **decision-support only**, never autonomous approval |
| **Administration** | Pharmacy license approval/rejection, platform analytics, audit log review |

---

## Architecture at a glance

```
┌──────────────────┐        ┌──────────────────────────┐
│  Next.js Frontend │ ─────▶ │   Node.js Backend API    │
│  (patient/pharmacy│  REST  │   (modular monolith,     │
│   /admin UI)       │        │   12 domain modules)     │
└──────────────────┘        └───────────┬──────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
             ┌────────────┐       ┌─────────────┐       ┌──────────────┐
             │ PostgreSQL │       │    Redis    │       │ File Storage │
             │ (Prisma)   │       │  (caching)  │       │ (uploads)    │
             └────────────┘       └─────────────┘       └──────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
             ┌────────────┐       ┌─────────────┐       ┌──────────────┐
             │ PaddleOCR  │       │ Qwen (Ollama)│      │  NLLB-200    │
             │  (OCR)     │       │ (structured  │      │ (translation)│
             │            │       │  extraction) │       │              │
             └────────────┘       └─────────────┘       └──────────────┘
```

The backend follows a **modular monolithic architecture** — one deployable
service, but internally separated into isolated domains (patient, pharmacy,
medicine, inventory, reservation, location, language, intelligence,
notification, administration, integration, analytics) so any domain could be
extracted into its own service later without a redesign.

Every AI output (prescription reading, license scoring, translation) is
treated as **advisory only** — a human always makes the actual approve/reject
decision. This is enforced structurally, not just by convention: the AI
Assistance Layer has no code path that can set a reservation, prescription,
or license to an approved state.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js, TypeScript, Express, Prisma |
| Database | PostgreSQL |
| Cache | Redis |
| OCR | PaddleOCR (self-hosted, FastAPI wrapper) |
| LLM | Qwen 2.5, served via Ollama (OpenAI-compatible API) |
| Translation | NLLB-200 (self-hosted, FastAPI wrapper) |
| Auth | JWT + role-based access control (PATIENT / PHARMACY / ADMIN) |
| Deployment | Docker + Docker Compose |

---

## Running the full stack locally

### 1. Backend + infrastructure

```bash
cd pharma_connect_backend
cp .env.example .env        # set JWT_SECRET at minimum
docker-compose up -d --build
# first boot of ollama/nllb takes a while — they pull/cache model weights
npx prisma migrate dev --name init
npx prisma db seed          # creates an initial admin account
```

API is now live at `http://localhost:4000/api/v1`.

### 2. Frontend

```bash
cd pharma_connect_frontend
cp .env.local.example .env.local   # points at the backend above by default
npm install
npm run dev
```

App is now live at `http://localhost:3000`.

### 3. Check everything is wired up

- `GET http://localhost:4000/api/v1/health` → `{"success":true,"data":{"status":"ok"}}`
- Visit `http://localhost:3000`, register a patient account, check
  `http://localhost:8025` (Mailhog) for the verification email.

See each app's README for troubleshooting (network/DNS issues pulling Docker
images, Prisma engine downloads, per-service health checks for PaddleOCR/
Ollama/NLLB, etc).

---

## Documentation

- **[`docs/PDPMRS-SRS.docx`](./docs/PDPMRS-SRS.docx)** — full Software
  Requirements Specification (ISO/IEC/IEEE 29148:2018 structure): functional
  requirements with unique IDs per domain, design constraints, system
  architecture, non-functional requirements, operational modes, and
  stakeholder analysis. This is the source of truth for *what* the system is
  supposed to do; the code is the implementation of it.

---

## Project status

This is an active scaffold, not a finished product. Built out so far:

- ✅ Backend: all 12 domains, real AI service integration, reservation
  lifecycle with automatic expiration, RBAC, audit logging
- ✅ Frontend: patient, pharmacy, and admin flows covering the core journeys
- ✅ Docker Compose orchestration for the full stack including AI services
- ⬜ Automated test suite (unit/integration/e2e)
- ⬜ Stock-aware pharmacy search (currently distance-only; stock is checked
  at reservation submit time)
- ⬜ Payment/delivery integration (out of scope per the SRS's "future
  expansion" notes)
- ⬜ CI/CD pipeline

## License

Not yet decided — add one before making this repository public.
