# Dockerfile for FlashFusion API
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci --prefer-offline --no-audit; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build shared packages that API depends on
RUN npx turbo build --filter=@flashfusion/api

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiuser

# Copy package.json and built application
COPY --from=builder --chown=apiuser:nodejs /app/package.json ./package.json
COPY --from=builder --chown=apiuser:nodejs /app/apps/api ./apps/api
COPY --from=builder --chown=apiuser:nodejs /app/packages ./packages
COPY --from=builder --chown=apiuser:nodejs /app/node_modules ./node_modules

# Install only production dependencies
RUN npm ci --only=production --prefer-offline --no-audit && npm cache clean --force

USER apiuser

EXPOSE 8080
ENV PORT 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["node", "apps/api/main.js"]