# Setup guide

## Prerequisites

| Tool       | Version                 | Install                                                                                       |
| ---------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| Node.js    | **22.11.0** LTS ("Jod") | Use [nvm](https://github.com/nvm-sh/nvm): `nvm install && nvm use` picks it up from `.nvmrc`. |
| pnpm       | **10+**                 | `corepack enable && corepack prepare pnpm@10.14.0 --activate`                                 |
| Docker     | 24+                     | Only required for `pnpm docker:up`.                                                           |
| PostgreSQL | 16                      | Only if you want to run without Docker; otherwise Compose provides it.                        |

## Fastest path: full stack via Docker

```bash
git clone https://github.com/josebright/iot-deviceshield.git
cd iot-deviceshield
cp .env.example .env
# open .env and set DB_PASSWORD, JWT_SECRET (>=32 chars), OPENAI_API_KEY
pnpm install
pnpm docker:up
```

That's it. When Compose reports both services healthy:

- API — <http://localhost:3000/v1>
- API health — <http://localhost:3000/v1/health>
- API docs (Swagger) — <http://localhost:3000/v1/docs>
- Web — <http://localhost:3001>

Teardown (including the postgres volume):

```bash
pnpm docker:down
```

Tail logs from all services:

```bash
pnpm docker:logs
```

## Local dev without Docker

Suitable when you want live reload and are running your own Postgres.

1. Start Postgres locally, create a database and user matching your `.env`.
2. Install deps and run both apps:

```bash
pnpm install
pnpm dev                                # runs turbo dev across all workspaces
# or, per app:
pnpm --filter @iot-deviceshield/api dev
pnpm --filter @iot-deviceshield/web dev
```

The API runs on `:3000`, the web on `:3001`. Both watch for changes.

## Environment variables

Every var, its purpose, and whether it's required is documented in [`.env.example`](../.env.example). At startup the API validates them against the [Zod schema](../apps/api/src/config/env.schema.ts); any missing or malformed var causes a fail-fast boot with a readable diff.

Generate a strong `JWT_SECRET`:

```bash
openssl rand -base64 48
```

## Database

### Development

`app.module.ts` sets `synchronize: NODE_ENV !== 'production'` — so the schema auto-syncs from entity metadata every boot in dev.

### Production

- `synchronize` is **off**.
- Ship schema changes as migrations under `apps/api/src/migrations/`.
- Migrations run manually (or in a deploy hook):

```bash
pnpm --filter @iot-deviceshield/api migration:run
pnpm --filter @iot-deviceshield/api migration:show
pnpm --filter @iot-deviceshield/api migration:revert    # rolls back one
```

### Creating a new migration

Edit an entity, then generate a migration that captures the diff against the live schema:

```bash
pnpm --filter @iot-deviceshield/api migration:generate src/migrations/<Name>
```

Review the generated `up()` / `down()` for anything TypeORM inferred incorrectly, then commit.

### Seed demo data

```bash
pnpm --filter @iot-deviceshield/api exec ts-node src/scripts/seed.ts
```

## Authentication smoke test

```bash
# Register (returns 201 with JWT)
curl -sX POST http://localhost:3000/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"an-appropriately-strong-password"}' | jq

# Login (returns 200 with JWT)
TOKEN=$(curl -sX POST http://localhost:3000/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"an-appropriately-strong-password"}' \
  | jq -r .accessToken)

# Public endpoint — no auth
curl -s http://localhost:3000/v1/category | jq

# Admin-only mutation — requires JWT with role=admin
curl -sX POST http://localhost:3000/v1/category \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Cameras"}' | jq
# → 403 unless your user is admin. Promote via SQL:
#   UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

## Common commands

```bash
pnpm dev                    # all apps in watch mode
pnpm build                  # production build across workspaces
pnpm test                   # unit tests across workspaces
pnpm typecheck              # strict tsc across workspaces
pnpm lint                   # eslint (with --fix)
pnpm format                 # prettier --write
pnpm format:check           # prettier --check (CI-friendly)
pnpm docker:up              # bring up full stack
pnpm docker:down            # tear down + wipe volumes
pnpm docker:logs            # tail all container logs
```

## Repository setup on GitHub

For the CI pipeline to work end-to-end and the security signals to reach the Security tab, do these once after pushing to GitHub:

1. **Settings → Code security and analysis**
   - Enable **Dependabot alerts** and **Dependabot security updates**
   - Enable **Code scanning** (uses CodeQL from `ci.yml`)
   - Enable **Secret scanning** and **Push protection**
   - Enable **Private vulnerability reporting**
2. **Settings → Branches → Add branch protection rule** for `main`:
   - Require a pull request before merging
   - Require **1 review** approval
   - Require status checks to pass: **`CI gate`**
   - Require branches to be up to date
   - Require conversation resolution
3. **Settings → Actions → General**
   - Restrict workflow permissions to **read repository contents** (the CI file requests write only where it needs it via `permissions:` blocks).

## Troubleshooting

- **`ECONNREFUSED postgres:5432` from the API container** — Postgres hasn't finished starting yet; Compose's `depends_on: service_healthy` should handle this, but on cold boots the retry can take ~30 s.
- **`Invalid environment configuration` on startup** — the Zod schema tells you exactly which var is missing or malformed; fix `.env` and restart.
- **Web app boots but categories won't load** — check `NEXT_PUBLIC_API_URL` and that CORS `FRONTEND_URL` on the API matches the origin your browser is using.
- **`pnpm audit` fails in CI with a high CVE** — bump the offending dep or, if it's a transitive that upstream hasn't patched, add a `pnpm.overrides` entry in the root `package.json` (with a code comment linking to the CVE).
- **Trivy CI job fails on a base-image CVE** — bump `ARG NODE_VERSION` in the affected Dockerfile.
