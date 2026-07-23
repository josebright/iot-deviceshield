# Local development setup

This guide covers what you need to run the project on your laptop. It assumes you have Docker and Node.js already installed.

## Prerequisites

| Tool                 | Version                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| Docker Desktop or CE | Any recent version with Compose v2                                                                   |
| Node.js              | 22.22.2 LTS (pinned in `.nvmrc`; `nvm use` picks it up)                                              |
| pnpm                 | 10.14.0 (matches `packageManager` in `package.json`; Corepack handles this automatically if enabled) |
| Free disk            | ~6 GB (Postgres image + Ollama image + Qwen 2.5 3B model)                                            |
| RAM                  | 8 GB minimum; 16 GB recommended (the LLM uses ~2 GB when loaded)                                     |

Optional: an NIST NVD API key ([free, one-minute registration](https://nvd.nist.gov/developers/request-an-api-key)) raises the rate limit from 5 requests / 30 s to 50 / 30 s.

## First-time setup

```bash
git clone https://github.com/josebright/iot-deviceshield.git
cd iot-deviceshield
cp .env.example .env
```

Two required values in `.env`:

```bash
DB_PASSWORD=<pick a password>
ADMIN_API_TOKEN=<generate with: openssl rand -hex 32>
```

Then start the stack:

```bash
docker compose --env-file .env -f infra/docker/docker-compose.yml up -d
```

First boot does three things you'll see in the logs:

1. Postgres starts and becomes healthy.
2. The Ollama container pulls its image (~1 GB).
3. A sidecar container asks Ollama to pull the Qwen 2.5 3B model (~1.9 GB). This is the slow part; expect 5–10 minutes on a normal home connection.

Once the sidecar finishes, the API boots and runs its startup catalog sync (upserts the 18 seed devices, resolves NIST CPE identifiers where possible). You'll see something like:

```text
catalog sync done in Nms: categories=5 devices=18 cpe=8
IoT-DeviceShield API listening on http://localhost:3000/v1
```

At that point, open [http://localhost:3001](http://localhost:3001).

## Environment variables

Full list is in `.env.example`. Highlights:

| Variable                         | Default               | Purpose                                                                                              |
| -------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `DB_PASSWORD`                    | (required)            | Postgres user password.                                                                              |
| `ADMIN_API_TOKEN`                | (required, ≥32 chars) | Bearer token that guards `/v1/admin/*` and `/v1/catalog/*` mutation routes.                          |
| `AI_ENABLED`                     | `true`                | Set to `false` to skip AI enrichment entirely (CVE data still returns).                              |
| `OLLAMA_HOST`                    | `http://ollama:11434` | Where the API reaches Ollama. Use `http://host.docker.internal:11434` for host-native Ollama on Mac. |
| `OLLAMA_MODEL`                   | `qwen2.5:3b`          | Model tag Ollama pulls and serves.                                                                   |
| `NVD_API_KEY`                    | (empty)               | Optional, raises NIST rate limit.                                                                    |
| `CVE_CACHE_MINUTES`              | `30`                  | Per-device CVE cache TTL.                                                                            |
| `CPE_RESOLVE_TTL_DAYS`           | `30`                  | How stale a CPE resolution can be before refresh.                                                    |
| `CLIENT_RATE_LIMIT_PER_MIN`      | `60`                  | Per-client rate limit (fingerprint-keyed).                                                           |
| `CLIENT_VULN_RATE_LIMIT_PER_MIN` | `10`                  | Per-client rate limit for `/v1/vulnerabilities`.                                                     |
| `SENTRY_DSN`                     | (empty)               | If unset, Sentry is a no-op.                                                                         |

## Running without Docker (iterative dev)

If you prefer to run the API in watch mode against a containerized Postgres and Ollama:

```bash
docker compose --env-file .env -f infra/docker/docker-compose.yml up -d postgres ollama ollama-model-pull

pnpm install
pnpm --filter @iot-deviceshield/types build
pnpm --filter @iot-deviceshield/catalog build

# API in one terminal:
DB_HOST=127.0.0.1 OLLAMA_HOST=http://127.0.0.1:11434 pnpm --filter @iot-deviceshield/api dev

# Web in another:
pnpm --filter @iot-deviceshield/web dev
```

## Running Ollama natively (macOS speed tip)

Docker Desktop on macOS cannot pass through the Metal GPU. Inference in the container is CPU-only, which is workable but slow. If you're on Apple Silicon and want fast responses, install Ollama on the host:

```bash
brew install ollama
ollama serve &
ollama pull qwen2.5:3b
```

Then point the API at the host by setting in `.env`:

```bash
OLLAMA_HOST=http://host.docker.internal:11434
```

And remove (or scale to zero) the `ollama` and `ollama-model-pull` services in `infra/docker/docker-compose.yml`.

## Common pitfalls

- **Model pull "hangs" on first boot.** It's downloading ~1.9 GB, not hanging. Watch it with `docker compose --env-file .env -f infra/docker/docker-compose.yml logs -f ollama-model-pull`.
- **`ADMIN_API_TOKEN must be at least 32 characters`.** Generate with `openssl rand -hex 32`.
- **First `/v1/vulnerabilities` request takes 30–120 seconds.** Ollama is generating enrichment for every CVE the first time. Subsequent hits within `CVE_CACHE_MINUTES` are served from the DB cache in milliseconds.
- **All CVE enrichment fields come back empty.** Check `docker compose logs api | grep ollama`. Common causes: model isn't pulled yet, `OLLAMA_HOST` is wrong, `AI_ENABLED=false`.

## Common commands

```bash
pnpm docker:up          # start the whole stack (foreground)
pnpm docker:down        # stop everything and drop volumes (fresh start)
pnpm docker:rebuild     # rebuild images without cache and restart
pnpm docker:logs        # tail logs

pnpm typecheck          # tsc --noEmit everywhere
pnpm lint               # eslint / next lint everywhere
pnpm test               # jest suites
```
