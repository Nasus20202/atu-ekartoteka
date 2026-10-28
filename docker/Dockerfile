FROM node:26.12.1-alpine@sha256:40cd011b55415bc894e45b02fdd5a5dfde056921b7d23a64c74f80497af48797 AS base
WORKDIR /app
# Node 26 images no longer bundle corepack, so install it from npm first
# renovate: datasource=npm depName=corepack
ARG COREPACK_VERSION=0.36.0
RUN npm install -g corepack@${COREPACK_VERSION} && corepack enable

# Install all dependencies (for building)
FROM base AS builder-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack install
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Install only production dependencies (for runner)
FROM base AS runner-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack install
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod --ignore-scripts

# Generate the Prisma client on the build host's native platform.
# The Prisma CLI crashes when run under QEMU emulation (cross-building
# linux/arm64 on an amd64 runner), and the generated client is not
# architecture-specific, so it is generated here and copied into the builder.
FROM --platform=$BUILDPLATFORM node:26.12.1-alpine@sha256:40cd011b55415bc894e45b02fdd5a5dfde056921b7d23a64c74f80497af48797 AS prisma-gen
WORKDIR /app
# renovate: datasource=npm depName=corepack
ARG COREPACK_VERSION=0.36.0
RUN npm install -g corepack@${COREPACK_VERSION} && corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack install
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY prisma ./prisma
COPY prisma.config.ts ./
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN pnpm exec prisma generate

# Build the application
FROM base AS builder
COPY --from=builder-deps /app/node_modules ./node_modules
COPY . .
COPY --from=prisma-gen /app/src/generated ./src/generated

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN pnpm build

# Production image
FROM base AS runner

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=runner-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma/
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static/
COPY --from=builder --chown=nextjs:nodejs /app/public ./public/
COPY --chown=nextjs:nodejs --chmod=755 docker/docker-entrypoint.sh ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
