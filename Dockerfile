# Multi-stage Dockerfile for production deployment

# Stage 1: Dependencies
FROM node:18-bullseye AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Stage 2: Builder
FROM node:18-bullseye AS build
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Install all dependencies (including dev) for building
RUN npm ci

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:18-bullseye-slim AS runner
WORKDIR /app

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --gid 1001 nodejs && \
    adduser --disabled-password --gecos "" --uid 1001 --ingroup nodejs nextjs

# Set NODE_ENV
ENV NODE_ENV=production

# Copy built application
COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma

# Copy necessary files
COPY --chown=nextjs:nodejs package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start the application
CMD ["npm", "start", "--", "-p", "3000"]