# syntax=docker/dockerfile:1
FROM golang:1.26-alpine AS builder

WORKDIR /app

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Build
COPY . .
RUN CGO_ENABLED=0 go build -o /architect-prep ./cmd/architect-prep

# Runtime
FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=builder /architect-prep .

EXPOSE 8080

CMD ["./architect-prep"]
