# Multi-stage build for Node.js application
# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Add package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install pnpm
RUN npm install -g pnpm@8

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Remove dev dependencies
RUN pnpm prune --prod

# Stage 2: Production stage
FROM node:20-alpine AS production

# Set NODE_ENV
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

# Create healthcheck script
RUN echo 'const http = require("http"); \
const options = { \
  host: "localhost", \
  port: process.env.PORT || 3000, \
  path: "/health", \
  timeout: 2000 \
}; \
const request = http.request(options, (res) => { \
  if (res.statusCode === 200) { \
    process.exit(0); \
  } else { \
    process.exit(1); \
  } \
}); \
request.on("error", () => process.exit(1)); \
request.end();' > healthcheck.js

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Set security-focused run command
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]

# Metadata
LABEL maintainer="your-email@example.com"
LABEL version="1.0.0"
LABEL description="Node.js application"
LABEL org.opencontainers.image.source="https://github.com/username/repo"