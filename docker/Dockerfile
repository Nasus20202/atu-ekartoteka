FROM node:24.12-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install all dependencies (for building)
FROM base AS builder-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# Install only production dependencies (for runner)
FROM base AS runner-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --prod --ignore-scripts

# Build the application
FROM base AS builder
COPY --from=builder-deps /app/node_modules ./node_modules
COPY . .

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN pnpm exec prisma generate && pnpm build

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
