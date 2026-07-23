# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22.22.2

FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache libc6-compat tini \
  && corepack enable \
  && corepack prepare pnpm@10.14.0 --activate
WORKDIR /workspace
ENV CI=true \
    PNPM_HOME=/pnpm-store \
    NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/catalog/package.json ./packages/catalog/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/eslint-config/package.json ./packages/eslint-config/
RUN --mount=type=cache,target=/pnpm-store \
    pnpm install --frozen-lockfile

FROM deps AS builder
COPY packages ./packages
COPY apps/web ./apps/web
ARG NEXT_PUBLIC_API_URL=http://localhost:3000/v1
ARG NEXT_PUBLIC_SENTRY_DSN=
ARG SENTRY_AUTH_TOKEN=
ARG SENTRY_ORG=iot-deviceshield
ARG SENTRY_PROJECT=iot-deviceshield-frontend
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN} \
    SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN} \
    SENTRY_ORG=${SENTRY_ORG} \
    SENTRY_PROJECT=${SENTRY_PROJECT}
RUN pnpm --filter @iot-deviceshield/types build \
 && pnpm --filter @iot-deviceshield/web build

FROM node:${NODE_VERSION}-alpine AS runtime
RUN apk upgrade --no-cache \
  && apk add --no-cache tini wget \
  && addgroup -S app && adduser -S app -G app \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=builder --chown=app:app /workspace/apps/web/.next/standalone ./
COPY --from=builder --chown=app:app /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=app:app /workspace/apps/web/public ./apps/web/public

USER app
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --spider -qO- http://127.0.0.1:3001/ || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/web/server.js"]
