# IoT-DeviceShield

> Smart Home Device vulnerability & risk assessment platform. NestJS API + Next.js dashboard, hardened for production.

[![CI](https://img.shields.io/badge/ci-pending-lightgrey.svg)](.)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-22.11%20LTS-brightgreen.svg)](.nvmrc)

IoT-DeviceShield helps operators inventory smart-home devices, correlate them with the latest CVEs from the NIST National Vulnerability Database, and generate AI-assisted threat, impact, and remediation guidance per finding.

## Quick start

```bash
git clone https://github.com/<your-org>/iot-deviceshield.git
cd iot-deviceshield
cp .env.example .env      # then fill in DB creds + OPENAI_API_KEY
pnpm install
pnpm docker:up            # postgres + api + web
open http://localhost:3001
```

## Tech stack

| Layer     | Choice                                                            |
| --------- | ----------------------------------------------------------------- |
| Monorepo  | pnpm workspaces + Turborepo                                       |
| API       | NestJS 10 · TypeORM · PostgreSQL 16 · Zod env validation          |
| Web       | Next.js 14 App Router · React 18 · MUI · CSS Modules              |
| Shared    | `@iot-deviceshield/types` — DTOs & interfaces used by API and web |
| AI        | OpenAI GPT-4 (pluggable behind a provider interface, planned)     |
| CVE feed  | NIST NVD REST API 2.0                                             |
| Container | Multi-stage Dockerfiles, non-root user, healthchecks              |
| CI/CD     | GitHub Actions · Semgrep · Trivy · Gitleaks · CodeQL · Dependabot |
| Auth      | JWT (Passport) · argon2id · role-based guards                     |
| Observ.   | nestjs-pino structured logs · Sentry (guarded on DSN)             |

## Repo layout

```text
iot-deviceshield/
├── apps/
│   ├── api/                # NestJS backend
│   └── web/                # Next.js dashboard
├── packages/
│   ├── types/              # Shared DTOs & interfaces
│   ├── tsconfig/           # Shared tsconfig presets
│   └── eslint-config/      # Shared lint config
├── infra/
│   ├── docker/             # docker-compose for local
│   └── terraform/          # (roadmap) IaC for prod
├── docs/                   # ARCHITECTURE, SETUP, API, SECURITY
└── .github/workflows/      # CI/CD pipelines
```

## Common commands

```bash
pnpm dev                 # run all apps in dev mode (turbo)
pnpm build               # production build across workspaces
pnpm test                # unit + e2e tests
pnpm lint                # eslint across all packages
pnpm typecheck           # strict tsc across all packages
pnpm docker:up           # bring up full stack via docker-compose
pnpm docker:down         # tear down + wipe volumes
```

## History

This project evolved from two university-thesis repositories consolidated and hardened into a production-grade platform:

- **[cve-vulnerability-api](https://github.com/josebright/smart-home-vulnerabilities)** — the original NestJS backend
- **[shd-risk-assessment](https://github.com/josebright/shd-risk-assessment)** — the original Next.js dashboard

The rewrite consolidates both under one monorepo with shared types, adds authentication, rate limiting, CI/CD, containerization, secret scanning, and observability. Both legacy repos remain public for reference.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — system design + data model
- [Setup](docs/SETUP.md) — local dev, env vars, seeding
- [API](docs/API.md) — endpoint reference (auto-generated from Swagger)
- [Security](docs/SECURITY.md) — threat model, secret handling
- [Contributing](CONTRIBUTING.md)

## License

[MIT](LICENSE)
