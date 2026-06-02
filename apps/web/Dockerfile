# =========================================
# Stage 1: Build
# =========================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json tsconfig.json ./

# Copy shared packages
COPY packages/shared-types/ packages/shared-types/
COPY packages/shared-utils/ packages/shared-utils/
COPY packages/ui/ packages/ui/

# Copy web workspace
COPY apps/web/ apps/web/

# Install all workspace dependencies
RUN npm ci --workspace=@tarot-platform/web --workspace=@tarot-platform/shared-types --workspace=@tarot-platform/shared-utils --workspace=@tarot-platform/ui

# Build shared packages first
RUN npm run build -w @tarot-platform/shared-types
RUN npm run build -w @tarot-platform/shared-utils
RUN npm run build -w @tarot-platform/ui

# Build web app
RUN npm run build -w @tarot-platform/web

# =========================================
# Stage 2: Serve with nginx
# =========================================
FROM nginx:alpine AS production

# Copy built static files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# SPA fallback config
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
