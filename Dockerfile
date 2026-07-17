# ─── Stage 1: Build frontend (Bun + vite-plus) ──────────────────────
FROM oven/bun:1.3.14 AS frontend
USER root
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /web
# Cache deps
COPY web/package.json web/bun.lock ./
RUN bun install --frozen-lockfile

# Build
COPY web/ ./
RUN bun run build

# ─── Stage 2: Build backend + seed tools ────────────────────────────
FROM golang:1.26-alpine AS backend
ENV GOPROXY=https://goproxy.cn,direct
WORKDIR /app

COPY server/go.mod server/go.sum ./
RUN go mod download

COPY server/ .
RUN CGO_ENABLED=0 go build -o /architect-prep ./cmd/architect-prep
RUN CGO_ENABLED=0 go build -o /seed ./cmd/seed

# ─── Stage 3: Generate seed database ────────────────────────────────
# Single source of truth: server/data/bank.json (external aggregated bank)
FROM backend AS seed-build
RUN /seed -db /seed.db

# ─── Stage 4: Runtime ───────────────────────────────────────────────
FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=backend /architect-prep .
COPY --from=seed-build /seed.db ./seed.db
COPY --from=frontend /web/dist ./web/dist

ENV DB_PATH=/data/architect.db

EXPOSE 8080
CMD ["sh", "-c", "if [ ! -f \"$DB_PATH\" ] || [ \"$(wc -c < \"$DB_PATH\" 2>/dev/null || echo 0)\" -lt 8192 ]; then mkdir -p \"$(dirname \"$DB_PATH\")\" && cp /app/seed.db \"$DB_PATH\"; fi && ./architect-prep"]
