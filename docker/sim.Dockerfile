###############################################################################
# PortVision Simulator — fake headsets + fake sensor publisher.
# Optional service. Useful for staging demos. Do not deploy to real production.
# Build context: repo root.
#   docker build -f docker/sim.Dockerfile -t portvision-sim .
###############################################################################

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/sim/package.json ./apps/sim/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile \
    --filter @portvision/sim... \
    --filter @portvision/shared

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/sim/node_modules ./apps/sim/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/sim ./apps/sim
COPY packages/shared ./packages/shared

WORKDIR /app/apps/sim
CMD ["pnpm", "exec", "tsx", "src/index.ts"]
