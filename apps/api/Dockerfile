# syntax=docker/dockerfile:1.7
# ============================================================================
# IoT-DeviceShield API — multi-stage build
# Base image is pinned by digest in CI; alpine is used for a small footprint.
# Build context is the repo root: `docker build -f apps/api/Dockerfile .`
# ============================================================================

ARG NODE_VERSION=22.11.0

# ---- Stage 1: base with pnpm -----------------------------------------------
FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache libc6-compat tini \
  && corepack enable \
  && corepack prepare pnpm@10.14.0 --activate
WORKDIR /workspace
ENV NODE_ENV=production \
    CI=true \
    PNPM_HOME=/pnpm-store

# ---- Stage 2: install dependencies (cached on lockfile changes only) -------
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/eslint-config/package.json ./packages/eslint-config/
RUN --mount=type=cache,target=/pnpm-store \
    pnpm install --frozen-lockfile

# ---- Stage 3: build the API + shared packages ------------------------------
FROM deps AS builder
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm --filter @iot-deviceshield/types build \
 && pnpm --filter @iot-deviceshield/api build

# Prune to a minimal production-only workspace for the runtime stage.
RUN pnpm --filter @iot-deviceshield/api deploy --prod --legacy /prod/api

# ---- Stage 4: runtime -------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runtime
RUN apk add --no-cache tini wget \
  && addgroup -S app && adduser -S app -G app
WORKDIR /app
ENV NODE_ENV=production \
    API_PORT=3000

COPY --from=builder --chown=app:app /prod/api/node_modules ./node_modules
COPY --from=builder --chown=app:app /prod/api/dist ./dist
COPY --from=builder --chown=app:app /prod/api/package.json ./package.json

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --spider -qO- http://127.0.0.1:3000/v1/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
