# Stage 1: Build
FROM node:18-alpine AS build-stage

# Cài đặt pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies với pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Pass build arguments as environment variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build production
RUN pnpm run build

# Stage 2: Production với Nginx
FROM nginx:alpine AS production-stage

# Copy built files từ build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]