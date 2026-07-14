# Stage 1: Build backend + seed tools
FROM golang:1.25-alpine AS backend
ENV GOPROXY=https://goproxy.cn,direct
WORKDIR /app

COPY server/go.mod server/go.sum ./
RUN go mod download

COPY server/ . .
RUN CGO_ENABLED=0 go build -o /architect-prep ./cmd/architect-prep
RUN CGO_ENABLED=0 go build -o /seed ./cmd/seed
RUN CGO_ENABLED=0 go build -o /import-questions ./cmd/import-questions

# Stage 2: Generate seed database
FROM backend AS seed-build
COPY server/data/questions ./data/questions
RUN /seed -db /seed.db && /import-questions -db /seed.db -dir ./data/questions

# Stage 3: Runtime (backend + frontend static + seed db)
FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=backend /architect-prep .
COPY --from=seed-build /seed.db ./seed.db
COPY web/dist ./web/dist

ENV DB_PATH=/data/architect.db

EXPOSE 8080
CMD ["sh", "-c", "if [ ! -f \"$DB_PATH\" ] || [ $(wc -c < \"$DB_PATH\" 2>/dev/null) -lt 8192 ]; then mkdir -p $(dirname $DB_PATH) && cp /app/seed.db \"$DB_PATH\"; fi && ./architect-prep"]
