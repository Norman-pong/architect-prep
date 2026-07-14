# Stage 1: Build backend
FROM golang:1.25-alpine AS backend
ENV GOPROXY=https://goproxy.cn,direct
WORKDIR /app

COPY server/go.mod server/go.sum ./
RUN go mod download

COPY server/ . .
RUN CGO_ENABLED=0 go build -o /architect-prep ./cmd/architect-prep

# Stage 2: Runtime (backend + frontend static)
FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=backend /architect-prep .
COPY web/dist ./web/dist

EXPOSE 8080
CMD ["./architect-prep"]
