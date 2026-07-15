# Architecture

## System overview

IoT-DeviceShield is a two-tier application that catalogs smart-home devices, correlates them with CVEs from NIST's National Vulnerability Database, and generates AI-assisted threat / impact / remediation guidance per finding.

```mermaid
flowchart LR
    User([Operator])
    subgraph Browser
      Web[Next.js dashboard<br/>apps/web]
    end
    subgraph Server
      API[NestJS API<br/>apps/api<br/>/v1/*]
      PG[(PostgreSQL 16)]
    end
    subgraph External
      NIST[NIST NVD REST API]
      OpenAI[OpenAI GPT-4]
      Sentry[Sentry]
    end

    User -->|HTTPS| Web
    Web -->|JWT / JSON| API
    API -->|SQL| PG
    API -->|HTTPS| NIST
    API -->|HTTPS| OpenAI
    API -.errors.-> Sentry
```

- **Web** issues browser fetches to the API; it holds a JWT in memory after login.
- **API** owns all business logic — auth, device inventory, CVE ingestion, AI orchestration, persistence.
- Shared **`@iot-deviceshield/types`** package holds the interfaces both tiers agree on.

## Repository layout

```text
iot-deviceshield/
├── apps/
│   ├── api/            NestJS 10 + TypeORM + PostgreSQL
│   └── web/            Next.js 14 App Router + MUI
├── packages/
│   ├── types/          Shared DTOs & domain interfaces
│   ├── tsconfig/       Strict base + Nest/Next presets
│   └── eslint-config/  Shared lint rules
├── infra/
│   └── docker/         docker-compose for local dev
├── docs/               Architecture, setup, API reference
└── .github/
    ├── workflows/      CI (lint/test/audit/SAST/scan)
    └── dependabot.yml
```

## Data model

```mermaid
erDiagram
  USERS ||--o{ AUDIT_LOG : "future"
  SMART_HOME_CATEGORIES ||--o{ SMART_HOME_DEVICES : has
  SMART_HOME_DEVICES    ||--o{ SMART_HOME_VULNERABILITIES : has

  USERS {
    int id PK
    varchar(254) email UK
    varchar(255) passwordHash
    enum role "admin | user"
    timestamptz createdAt
    timestamptz updatedAt
  }
  SMART_HOME_CATEGORIES {
    int id PK
    text name
  }
  SMART_HOME_DEVICES {
    int id PK
    text name
    int categoryId FK
  }
  SMART_HOME_VULNERABILITIES {
    int id PK
    varchar cveId UK "nullable"
    text vulnerability "AI-generated"
    text impact        "AI-generated"
    text affectedSystem "AI-generated"
    text threats       "AI-generated"
    text recommendations "AI-generated"
    text lastModified "nullable"
    text vulnStatus   "nullable"
    json metrics       "CvssMetrics[]"
    text references    "simple-array"
    int deviceId FK
  }
```

- All foreign keys cascade on delete.
- `USERS.email` is stored lower-cased and uniquely indexed.
- `SMART_HOME_VULNERABILITIES.cveId` is unique; ingestion skips CVEs already present for a device.

## Request flow — `GET /v1/vulnerabilities?keywordSearch=<device>`

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant W as Next.js
    participant A as NestJS API
    participant PG as PostgreSQL
    participant N as NIST NVD
    participant O as OpenAI

    B->>W: user picks device
    W->>A: GET /v1/vulnerabilities?keywordSearch=router<br/>Authorization: Bearer <jwt>
    A->>A: JwtAuthGuard + Throttler (10/min)
    A->>PG: find device by name
    alt device missing
      A-->>W: 404 NotFound
    else device found
      A->>N: GET /rest/json/cves/2.0?keywordSearch=router
      loop for each new CVE
        A->>PG: exists cveId?
        A->>O: 5× chat.completions (Promise.all)
        A->>PG: save Vulnerability
      end
      A->>PG: find vulnerabilities where device.id
      A-->>W: 200 [Vulnerability]
    end
```

- Every request gets an `x-request-id` (correlated in logs).
- 5xx errors are captured to Sentry when `SENTRY_DSN` is set.
- The `strict` throttler on `/v1/vulnerabilities` (10 requests/minute) is deliberate — the endpoint fans out to 5 OpenAI calls per new CVE and is the most expensive path in the system.

## Runtime topology (containerized)

```mermaid
flowchart TB
    subgraph Compose[docker-compose network: iot-deviceshield]
      direction TB
      Postgres[(postgres:16-alpine<br/>vol: postgres-data)]
      Api[iot-deviceshield/api<br/>:3000 -> /v1/*]
      Web[iot-deviceshield/web<br/>:3001]
    end
    Public[Public traffic] -->|3001| Web
    Web -->|internal DNS| Api
    Api -->|5432| Postgres
```

Both containers run as non-root (`app` user), with `no-new-privileges` and `cap_drop: ALL` set in Compose. Health probes hit `/v1/health` (API) and `/` (web). Postgres uses `pg_isready` for its healthcheck; API `depends_on` postgres with `condition: service_healthy`.

## Tooling & DX

| Concern         | Choice                       | Notes                                                                                         |
| --------------- | ---------------------------- | --------------------------------------------------------------------------------------------- |
| Package manager | **pnpm 9**                   | Fast, disk-efficient; strict about peer deps.                                                 |
| Monorepo runner | **Turborepo**                | `^build` graph ensures `packages/types` builds before consumers.                              |
| Language        | TypeScript 5, `strict: true` | See [`packages/tsconfig/base.json`](../packages/tsconfig/base.json).                          |
| API framework   | NestJS 10                    | Modules, DI, class-validator DTOs.                                                            |
| ORM             | TypeORM 0.3                  | Migrations checked in under `apps/api/src/migrations`.                                        |
| Auth            | JWT (Passport) + argon2id    | `JwtAuthGuard`, `RolesGuard`, `@Roles()` decorator.                                           |
| Rate limiting   | `@nestjs/throttler`          | Global 100/min, strict 10/min on vulnerabilities, 20/min on auth.                             |
| Logging         | `nestjs-pino`                | Structured JSON in prod, pretty in dev. Redacts auth headers and passwords.                   |
| Errors          | Global `AllExceptionsFilter` | Sanitizes 5xx, forwards to Sentry.                                                            |
| Frontend        | Next.js 14 App Router        | `output: 'standalone'` for Docker image.                                                      |
| UI              | Material UI 6                | CSS Modules for layout.                                                                       |
| CI              | GitHub Actions               | Lint / typecheck / test / `pnpm audit` / **Semgrep** / **Gitleaks** / **CodeQL** / **Trivy**. |
| Dep updates     | Dependabot                   | Weekly, grouped by ecosystem.                                                                 |

## Security posture

Enforced at code and pipeline levels:

- **Env validation on boot** ([env.schema.ts](../apps/api/src/config/env.schema.ts)) — missing `JWT_SECRET` (min 32 chars), `OPENAI_API_KEY`, or DB creds → the process exits with a diff-style error.
- **CORS** restricted to `FRONTEND_URL`.
- **Helmet** for standard response headers (X-Frame-Options, HSTS, CSP defaults, etc.).
- **Password storage** via `argon2id` (`argon2.hash` with default OWASP-recommended params).
- **JWT** signed with an operator-supplied secret; expiry via `JWT_EXPIRES_IN`.
- **Guards** on every mutating endpoint (`POST/DELETE /v1/{category,devices}` require `admin`).
- **Rate limits** protect the expensive AI path.
- **`synchronize: true`** only in non-production; prod uses TypeORM migrations.
- **`pnpm audit`, Semgrep, Gitleaks, CodeQL, Trivy** run on every PR and merge.
- **Non-root containers**, `cap_drop: ALL`, `no-new-privileges`.
- **Full [SECURITY.md](../SECURITY.md)** covers threat model and disclosure.

## Extension points

- **Add another AI provider** → replace `openAI.chat.completions.create` with a small `AiProvider` interface behind DI; keep the existing 5-prompt structure.
- **Multi-tenant** → add `organizationId` to `User`, `Category`, `Device`; scope every query in the services. Migration required.
- **CVE severity email digest** → new `AlertsModule` with a cron job (`@nestjs/schedule`) that queries `Vulnerability` by severity and dispatches to a mail provider.
- **Non-Postgres deployments** → the TypeORM datasource is the only place that knows the driver; swapping is a config change plus a fresh migration set.
