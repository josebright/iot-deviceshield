# IoT-DeviceShield

Smart-home device vulnerability lookup, backed by NIST NVD data and enriched with a locally-hosted LLM. NestJS API, Next.js dashboard, PostgreSQL, all wired together in Docker Compose.

The point of the project: pick a smart-home device, see the published CVEs against it, and read a plain-language summary of what each one means. No hosted AI provider, no API keys to sign up for, no request quotas. The language model runs on your machine.

## Status

This is a personal project I built to sharpen my back-end and DevSecOps skills. It works end-to-end locally. It is not deployed anywhere public, and it is not production-hardened for a multi-tenant workload.

- CVE data source: NIST NVD REST API 2.0 (public, no auth required, optional API key raises rate limits).
- AI enrichment: [Ollama](https://ollama.com) running a Qwen 2.5 3B open-weight model. Everything happens on your machine; no data leaves the network.
- Storage: PostgreSQL 16.

## Quick start

Prerequisites: Docker Desktop (or Docker Engine + Compose v2). On a laptop with 8 GB RAM or more.

```bash
git clone https://github.com/josebright/iot-deviceshield.git
cd iot-deviceshield
cp .env.example .env
# generate an admin token used to guard admin/catalog mutation routes:
printf "ADMIN_API_TOKEN=%s\n" "$(openssl rand -hex 32)" >> .env
docker compose --env-file .env -f infra/docker/docker-compose.yml up -d
```

First boot downloads the Ollama image (~1 GB) and the Qwen 2.5 3B model (~1.9 GB). Give it 5–10 minutes on a fresh clone. Subsequent boots are instant because the volume caches both.

Then open [http://localhost:3001](http://localhost:3001).

## What it does

1. On first boot, the API walks a curated catalog (`packages/catalog/src/catalog.json`) of ~18 smart-home devices, upserts them into Postgres, and asks the NIST CPE dictionary to resolve a canonical CPE identifier for each. Higher-confidence matches get used for later CVE lookups.
2. When a user picks a device on the web app, the API queries NIST NVD for CVEs matching that device (by `cpeName` when available, otherwise by keyword search).
3. For each CVE, the API sends the description to a locally-running Qwen 2.5 model and asks for five plain-language fields as JSON: what the vulnerability is, the threat, the impact, the affected systems, and a recommendation.
4. The result is cached per-device in the database (default 30 minutes). Subsequent lookups for the same device inside the TTL are served from cache in a few tens of milliseconds.
5. Every incoming request is fingerprinted (IP, user agent, `X-Client-Id`) and rate-limited per client. Repeat abusers can be auto-throttled or manually blocked via an admin endpoint.

## Tech stack (what's actually running)

| Layer      | Choice                                                      |
| ---------- | ----------------------------------------------------------- |
| Monorepo   | pnpm workspaces + Turborepo                                 |
| API        | NestJS 11 · TypeORM · PostgreSQL 16 · Zod env validation    |
| Web        | Next.js 15 App Router · React 19 · MUI 6                    |
| Shared     | `@iot-deviceshield/types`, `@iot-deviceshield/catalog`      |
| AI         | Ollama running Qwen 2.5 3B (Q4_K_M quantization)            |
| CVE feed   | NIST NVD REST API 2.0                                       |
| Container  | Multi-stage Alpine Dockerfiles, non-root user, healthchecks |
| Rate limit | Fingerprint-keyed per-client throttle + admin blocklist     |
| Observ.    | nestjs-pino JSON logs · Sentry on the web (opt-in via DSN)  |

## Endpoints

Public (rate-limited, no auth):

- `GET /v1/category` — categories with their devices
- `GET /v1/devices/:slug` — one device by slug
- `GET /v1/vulnerabilities?slug=<slug>` — CVEs + AI enrichment for a device
- `GET /v1/health` — liveness
- `GET /v1/health/ready` — readiness (DB check)

Admin (bearer token from `ADMIN_API_TOKEN`):

- `POST /v1/catalog/refresh` — force catalog + CPE resync
- `POST /v1/catalog/devices/:slug/resolve-cpe` — retry CPE resolution for one device
- `GET  /v1/catalog/status` — last refresh, unresolved devices, error tail
- `GET  /v1/admin/clients` — paginated fingerprint registry
- `POST /v1/admin/clients/:id/blacklist`
- `POST /v1/admin/clients/:id/unblacklist`

Swagger UI is served at [http://localhost:3000/v1/docs](http://localhost:3000/v1/docs) in development.

## Repository layout

```text
iot-deviceshield/
├── apps/
│   ├── api/                   # NestJS backend
│   └── web/                   # Next.js dashboard
├── packages/
│   ├── catalog/               # Curated device catalog + Zod schema
│   ├── types/                 # Shared DTOs and domain types
│   ├── tsconfig/              # Shared TSConfig presets
│   └── eslint-config/         # Shared ESLint config
├── infra/
│   └── docker/                # docker-compose stack
├── docs/                      # ARCHITECTURE, SETUP, SECURITY
└── .github/workflows/         # CI: lint, typecheck, test, security scans
```

## Common commands

```bash
pnpm install                   # install workspaces
pnpm dev                       # run api + web in watch mode
pnpm build                     # production build for every workspace
pnpm typecheck                 # tsc --noEmit across the monorepo
pnpm lint                      # ESLint / next lint
pnpm test                      # jest suites

# Docker stack
pnpm docker:up                 # start postgres + ollama + api + web
pnpm docker:down               # stop everything (keeps volumes)
pnpm docker:rebuild            # rebuild images without cache
```

## What's tested and what isn't

Honest baseline as of this commit:

| Area                                    | Tested                                                           |
| --------------------------------------- | ---------------------------------------------------------------- |
| Catalog schema (Zod validation)         | Yes                                                              |
| CVSS metric normalization               | Yes                                                              |
| Vulnerabilities service (NIST + Ollama) | No, exercised manually via curl and the UI                       |
| Catalog sync (upserts + CPE resolution) | No, exercised manually on first boot                             |
| Client fingerprint registry             | No, exercised manually                                           |
| Admin endpoints                         | No, exercised manually via `curl -H "Authorization: Bearer ..."` |
| Web UI                                  | Built and rendered locally with a Playwright smoke check         |

The tests directory is not the interesting story here. The interesting story is the architecture and the fact that the AI enrichment runs offline.

## History

This project consolidates and replaces two earlier university-thesis repositories that are being kept online as historical artifacts:

- [cve-vulnerability-api](https://github.com/josebright/smart-home-vulnerabilities) — the original NestJS backend
- [shd-risk-assessment](https://github.com/josebright/shd-risk-assessment) — the original Next.js dashboard

Both legacy repos remain public for reference. Neither is maintained.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — data model, request flow, security posture, decisions and trade-offs
- [docs/SETUP.md](docs/SETUP.md) — local development, environment variables, common pitfalls
- [CONTRIBUTING.md](CONTRIBUTING.md) — code style, workflow, PR expectations
- [SECURITY.md](SECURITY.md) — vulnerability disclosure policy

## License

This project is released under the **PolyForm Noncommercial License 1.0.0**. You can read, run, fork, and modify the code for personal, research, or educational use. Commercial use (including hosting a public deployment) requires my written permission. Details in [LICENSE](LICENSE).
