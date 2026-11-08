FROM node:26.13.0-alpine@sha256:8996bb5821d62a8fd9bb27c1cb07462f3fdce6e47d640c6a881ead0b064ce216 AS base
WORKDIR /app

# Node 26 images no longer bundle corepack; install it only where pnpm is needed
# renovate: datasource=npm depName=corepack
FROM base AS base-corepack
ARG COREPACK_VERSION=0.36.0
RUN npm install -g corepack@${COREPACK_VERSION} && corepack enable

# Install all dependencies (for building)
FROM base-corepack AS builder-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack install
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile

# Install only production dependencies (for runner; includes Prisma CLI for migrate deploy)
FROM base-corepack AS runner-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack install
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile --prod

# Build the application
FROM builder-deps AS builder
COPY . .

ARG DEPLOYMENT_ID
ENV DEPLOYMENT_ID=$DEPLOYMENT_ID
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV NEXT_TELEMETRY_DISABLED=1

# --liftoff-only: Node 26 wasm optimizer corrupts Prisma DMMF under QEMU arm64
RUN node --liftoff-only node_modules/prisma generate && pnpm build

# Production image (no Corepack/pnpm needed at runtime)
FROM base AS runner

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=runner-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma/
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static/
COPY --from=builder --chown=nextjs:nodejs /app/public ./public/
COPY --chown=nextjs:nodejs --chmod=755 docker/docker-entrypoint.sh ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
