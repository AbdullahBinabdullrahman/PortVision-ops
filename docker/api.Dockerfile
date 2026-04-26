###############################################################################
# PortVision API — Fastify + Prisma + MQTT + WebSocket.
# Build context: repo root.
#   docker build -f docker/api.Dockerfile -t portvision-api .
###############################################################################

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate
WORKDIR /app

# ---------- deps ----------
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile \
    --filter @portvision/api... \
    --filter @portvision/shared

# ---------- runtime image ----------
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

WORKDIR /app/apps/api
# Generate the Prisma client into node_modules.
RUN pnpm exec prisma generate

EXPOSE 4000
# `migrate deploy` applies pending migrations on boot, then start with tsx.
# tsx is shipped in apps/api devDeps; running TS directly avoids a tsc build
# that would have to deal with workspace .ts shared package resolution.
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm exec tsx src/server.ts"]
