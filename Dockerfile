# Stage 1: Build Angular Analog App
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build the app
ENV NODE_OPTIONS="--max-old-space-size=8192"
RUN npm run build


# Stage 2: Create a minimal runtime image with a non-root user
FROM node:20-alpine AS user-setup
RUN addgroup --system appgroup && adduser --system --group appuser


# Stage 3: Create a minimal runtime image
FROM gcr.io/distroless/nodejs20 AS runner

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json ./

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Healthcheck to verify the app is running
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --spider -q http://localhost:3000/api/health || exit 1

# Start the app with logging
CMD ["node", "dist/analog/server/index.mjs"]
