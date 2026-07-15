# Contributing to IoT-DeviceShield

Thanks for taking the time to contribute! This document covers the workflow, code standards, and expectations for changes to this repository.

## Getting set up

```bash
git clone https://github.com/<your-org>/iot-deviceshield.git
cd iot-deviceshield
cp .env.example .env      # fill in real values
pnpm install
pnpm docker:up            # postgres + api + web via Docker
# or, for iterative dev:
pnpm dev                  # runs turbo → all workspaces in watch mode
```

Requirements:

- Node.js **22.11.0** LTS (pinned in `.nvmrc`)
- pnpm **10+**
- Docker + Docker Compose (for `docker:up`)

## Repository layout

- `apps/api` — NestJS backend
- `apps/web` — Next.js dashboard
- `packages/types` — shared DTOs consumed by both apps
- `packages/tsconfig`, `packages/eslint-config` — shared tooling
- `infra/docker` — Docker Compose for local dev
- `.github/workflows` — CI pipeline

## Branching + commits

- Branch from `main`: `feat/<short-slug>`, `fix/<short-slug>`, `chore/<short-slug>`.
- Follow **[Conventional Commits](https://www.conventionalcommits.org/)** for commit messages:
  - `feat(api): add /v1/devices bulk import`
  - `fix(web): guard against empty vulnerability metrics`
  - `chore(deps): bump next to 14.2.20`
  - `docs(readme): add screenshot`
- Keep commits small and reviewable. Squash-merge into `main`.

## Pull request checklist

Before opening a PR, verify locally:

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm format:check` passes (run `pnpm format` to auto-fix)
- [ ] If you touched the API surface, both DTOs and any consuming web-app code are updated
- [ ] If you added a new env var, `.env.example` and `apps/api/src/config/env.schema.ts` are updated
- [ ] If you touched auth or a public endpoint, the change is called out in the PR description

CI (`.github/workflows/ci.yml`) additionally runs Semgrep, Gitleaks, CodeQL, Trivy, and `pnpm audit`. All must be green.

## Code standards

### TypeScript

- **strict** mode is on repo-wide via `@iot-deviceshield/tsconfig`. Do not turn off strict flags in a per-workspace `tsconfig.json` without a `TODO` and a linked issue.
- No `any`. Use `unknown` and narrow.
- Prefer `type` imports (`import type { X } from '...'`) for pure type usage.

### Runtime code

- **API**: services own business logic; controllers only route and validate. Every service method is `async` and returns typed data.
- **Web**: use the `apiClient` in `apps/web/src/lib/api.ts` — never call `fetch` directly from a component.
- **Secrets**: read only through `ConfigService` (API) or `process.env.NEXT_PUBLIC_*` (web). Never `process.env.SOMETHING` inline in business logic.

### Database changes

- All schema changes ship as a TypeORM migration under `apps/api/src/migrations/`.
- Never edit a merged migration — write a new one.
- Regenerate with `pnpm --filter @iot-deviceshield/api migration:generate src/migrations/<Name>`.

### Tests

- Unit tests co-located as `*.spec.ts` next to the source.
- Integration/e2e tests in `apps/api/test/`, `apps/web/e2e/`.
- Aim to cover: happy path + one failure path for every new service method or route.

## Security

Report vulnerabilities privately per [SECURITY.md](SECURITY.md). Do not open a public issue.

Never commit `.env` files. If you accidentally commit a secret, **rotate first**, then let a maintainer purge history — do not try to fix it with a follow-up commit.

## Style

- Prettier is authoritative. If the formatter disagrees with you, the formatter wins.
- ESLint config lives in `packages/eslint-config`. Rule changes need a PR and a rationale.
- Keep functions small. If a function is >60 lines, ask whether it should be two.

## Questions

Open a GitHub Discussion or ping the maintainer listed in `package.json`.
