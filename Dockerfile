# syntax=docker/dockerfile:1

# PulseOps web app (Next.js, standalone output).
#
# NEXT_PUBLIC_* values are compiled into the browser bundle, so they are BUILD arguments:
#   docker build \
#     --build-arg NEXT_PUBLIC_APP_URL=https://app.example.com \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
#     --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api/v1 \
#     --build-arg NEXT_PUBLIC_SOCKET_URL=https://api.example.com \
#     -t pulseops-web .
# Rebuild the image when any of them change.

# ──────────────────────────────────────────────
# Stage 1 — dependencies
# ──────────────────────────────────────────────
FROM node:26-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ──────────────────────────────────────────────
# Stage 2 — build
# ──────────────────────────────────────────────
FROM node:26-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_APP_NAME=PulseOps
ARG NEXT_PUBLIC_APP_URL=http://localhost:3001
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
# "cookie" keeps refresh tokens in an httpOnly cookie (needs app + API on the same site)
ARG NEXT_PUBLIC_REFRESH_TOKEN_TRANSPORT=
ARG NEXT_PUBLIC_DEFAULT_STORE=

ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL \
    NEXT_PUBLIC_REFRESH_TOKEN_TRANSPORT=$NEXT_PUBLIC_REFRESH_TOKEN_TRANSPORT \
    NEXT_PUBLIC_DEFAULT_STORE=$NEXT_PUBLIC_DEFAULT_STORE \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ──────────────────────────────────────────────
# Stage 3 — runtime
# ──────────────────────────────────────────────
FROM node:26-alpine AS production
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# tini = correct PID 1 signal handling; wget = HEALTHCHECK
RUN apk add --no-cache tini wget \
  && addgroup -S pulseops && adduser -S pulseops -G pulseops

COPY --from=builder --chown=pulseops:pulseops /app/public ./public
COPY --from=builder --chown=pulseops:pulseops /app/.next/standalone ./
COPY --from=builder --chown=pulseops:pulseops /app/.next/static ./.next/static

USER pulseops
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/login >/dev/null || exit 1

ENTRYPOINT ["tini", "--"]
CMD ["node", "server.js"]
