# syntax=docker/dockerfile:1.7
# ============================================================================
# IoT-DeviceShield Web — multi-stage build using Next.js standalone output
# Build context is the repo root: `docker build -f apps/web/Dockerfile .`
# ============================================================================

ARG NODE_VERSION=22.22.2

# ---- Stage 1: base with pnpm -----------------------------------------------
FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache libc6-compat tini \
  && corepack enable \
  && corepack prepare pnpm@10.14.0 --activate
WORKDIR /workspace
ENV CI=true \
    PNPM_HOME=/pnpm-store \
    NEXT_TELEMETRY_DISABLED=1

# ---- Stage 2: install workspace deps ---------------------------------------
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/eslint-config/package.json ./packages/eslint-config/
RUN --mount=type=cache,target=/pnpm-store \
    pnpm install --frozen-lockfile

# ---- Stage 3: build the web app --------------------------------------------
FROM deps AS builder
COPY packages ./packages
COPY apps/web ./apps/web
# NEXT_PUBLIC_* vars must be present at build time; they are inlined into the bundle.
ARG NEXT_PUBLIC_API_URL=http://localhost:3000/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN pnpm --filter @iot-deviceshield/types build \
 && pnpm --filter @iot-deviceshield/web build

# ---- Stage 4: runtime -------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runtime
# `apk upgrade` picks up patched Alpine OS packages (openssl, libcrypto, etc.)
# for CVEs Trivy flags on the base image. Removing npm/npx eliminates a large
# set of CVEs in npm's bundled dependencies — we use pnpm exclusively.
RUN apk upgrade --no-cache \
  && apk add --no-cache tini wget \
  && addgroup -S app && adduser -S app -G app \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# Next.js standalone bundle already contains the pruned node_modules it needs.
COPY --from=builder --chown=app:app /workspace/apps/web/.next/standalone ./
COPY --from=builder --chown=app:app /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=app:app /workspace/apps/web/public ./apps/web/public

USER app
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --spider -qO- http://127.0.0.1:3001/ || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/server.js"]
