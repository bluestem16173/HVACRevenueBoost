# syntax=docker/dockerfile:1
FROM node:22-slim AS base
WORKDIR /app

# Stage 1: Install dependencies using BuildKit Cache
FROM base AS deps
RUN apt-get update -qq && apt-get install --no-install-recommends -y libc6
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --include=dev

# Stage 2: Rebuild source code using Next.js cache
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Leverage Next.js cache and BuildKit cache speeds across repeated builds
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# Stage 3: Production Image (Standalone Output Mode)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy explicit static assets and Next "standalone" tranced engine (only requires 150mb vs 1GB entire repo)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# standalone mode produces a lightweight node server.js automatically without the massive Next compiler dependencies
CMD ["node", "server.js"]
