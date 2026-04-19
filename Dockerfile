# ═══════════════════════════════════════════════════════════════
#  TimeWise — Single-Image Full-Stack Dockerfile
#
#  Stage 1: Build React client (Vite)
#  Stage 2: Production Node.js server serving the built client
#
#  Build:
#    docker build \
#      --build-arg VITE_API_URL=/api \
#      -t timewise:latest .
#
#  Run:
#    docker run -p 5000:5000 --env-file server/.env timewise:latest
# ═══════════════════════════════════════════════════════════════

# ─── Stage 1: Build the React client ───────────────────────────
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Install deps (cached layer)
COPY client/package*.json ./
RUN npm install

# Copy source
COPY client/ .

# VITE_API_URL must be /api so the server (same origin) handles routing
# Override at build time if deploying client separately
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build


# ─── Stage 2: Production server ────────────────────────────────
FROM node:20-alpine AS production

# Security: non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install ONLY production server deps
COPY server/package*.json ./
RUN npm install --omit=dev

# Copy server source
COPY server/ .

# Copy the built React app into the location server/index.js expects:
#   path.join(__dirname, '../client/dist')  →  /app/../client/dist  →  /client/dist
# We're in /app, so the client build must be at /client/dist
COPY --from=client-builder /app/client/dist /client/dist

# Set permissions
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-5000}/api/health || exit 1

CMD ["node", "index.js"]
