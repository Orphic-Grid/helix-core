# Helix Core

Helix Core is a clinical intelligence MVP designed for hospitals, emergency rooms, doctors, and clinical administrators. It provides a clean, modern dashboard with secure patient lookup, unified medical history, medication context, and explainable risk alerts.

## Stack

- Frontend: Next.js 15, TypeScript, Tailwind CSS
- API: NestJS, PostgreSQL, JWT auth, refresh tokens, audit logging
- Intelligence service: Python FastAPI rule engine
- Local infra: Docker Compose with PostgreSQL

## Folder Structure

```text
apps/
  api/              NestJS backend
  web/              Next.js frontend
services/
  intelligence/     FastAPI alerts microservice
infra/
  db/init.sql       PostgreSQL schema and seed data
docker-compose.yml
```

## Demo Credentials

```text
Doctor: doctor@helix.local / password123
Admin:  admin@helix.local / password123
Patient: rahul@helix.local / password123 (ID: HX-10021)
Patient: neha@helix.local / password123 (ID: HX-10022)
Patient: farhan@helix.local / password123 (ID: HX-10023)
```

## Run Locally

### Using Docker Compose

```bash
docker compose up --build
```

Then open:

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1
- Intelligence: http://localhost:8000/docs
- PostgreSQL: localhost:5432

### Manual Development

Start PostgreSQL and load `infra/db/init.sql`, then:

```bash
cd services/intelligence
python -m venv .venv
.venv/Scripts/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

```bash
cd apps/api
npm install
npm run start:dev
```

```bash
cd apps/web
npm install
npm run dev
```

## API Endpoints

- `POST /auth/login` - login with email and password
- `POST /auth/refresh` - refresh access token using secure refresh cookie
- `POST /auth/logout` - revoke session and clear refresh cookie
- `GET /auth/me` - current authenticated user
- `GET /patients/search?q=...` - search patients by ID, phone, name, or ABHA-style ID
- `GET /patients/:id` - patient profile, timeline, medication, and vitals
- `GET /patients/:id/alerts` - clinical alert recommendations
- `GET /audit-logs` - admin-only audit history

## Key Improvements

- Modular NestJS services for auth, patients, alerts, and audit
- JWT access tokens plus refresh tokens in secure HTTP-only cookies
- Role-based audit access and centralized validation
- Trigram indexes and query tuning for fast patient search
- Docker Compose updated for internal API routing and refresh secrets
- Frontend UX redesigned for doctors with patient summary, timeline, and risk panel
- Explainable alert recommendations with severity scoring

## Alert Engine Rules

- Critical hypertension alerts for severe BP readings
- Warning-level elevated blood pressure alerts
- Critical bleeding risk when anticoagulants and trauma co-occur
- Medication interaction warnings for high-risk drug pairs
- Diabetes trend risk for repeated high glucose values

## Next Features

- ABHA / ABDM connector
- Hospital EMR integration
- Role-specific dashboards and approval workflows
- Multi-tenant hospital access controls
- Redis caching and paginated audit history

## Production Notes

- Render deploys can use the root `render.yaml` Blueprint. It creates PostgreSQL, the private API, the private intelligence service, and the public web service.
- The API reads `DATABASE_URL` from Render Postgres via `fromDatabase` and initializes `infra/db/init.sql` on first boot.
- The web service proxies `/api/v1/*` to the private API through `API_INTERNAL_HOSTPORT`, so the browser can keep using same-origin requests.
- Use strong `JWT_SECRET` and `JWT_REFRESH_SECRET` in production
- Enable HTTPS at the proxy/load balancer level
- Add an external rate-limit cache (Redis) for distributed deployments
- Run database migrations from `infra/db/` or a formal migration tool before upgrades
