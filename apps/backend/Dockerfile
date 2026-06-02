# =========================================
# Stage 1: Build
# =========================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json tsconfig.json ./

# Copy shared packages
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-types/index.ts packages/shared-types/
COPY packages/shared-types/tsconfig.json packages/shared-types/

COPY packages/shared-utils/package.json packages/shared-utils/
COPY packages/shared-utils/index.ts packages/shared-utils/
COPY packages/shared-utils/tsconfig.json packages/shared-utils/

COPY packages/ui/package.json packages/ui/
COPY packages/ui/index.ts packages/ui/
COPY packages/ui/tsconfig.json packages/ui/

# Copy backend workspace
COPY apps/backend/ apps/backend/

# Install all workspace dependencies
RUN npm ci --workspace=@tarot-platform/backend --workspace=@tarot-platform/shared-types --workspace=@tarot-platform/shared-utils --workspace=@tarot-platform/ui

# Build shared packages first
RUN npm run build -w @tarot-platform/shared-types
RUN npm run build -w @tarot-platform/shared-utils
RUN npm run build -w @tarot-platform/ui

# Generate Prisma Client
RUN npm run prisma:generate -w @tarot-platform/backend

# Build backend
RUN npm run build -w @tarot-platform/backend

# =========================================
# Stage 2: Production
# =========================================
FROM node:18-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy built artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

EXPOSE 4020

CMD ["node", "dist/src/main"]
