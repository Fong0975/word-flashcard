# Multi-stage build for Go backend
FROM golang:1.23.7-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --verbose --no-cache git

# Copy go.mod and go.sum first for better caching
COPY go.mod go.sum ./

# Download dependencies
RUN echo "Starting dependency download..." && \
    go mod download -x && \
    echo "Dependencies downloaded successfully"

# Copy source code
COPY . .

# Build the application
RUN echo "Starting Go build process..." && \
    CGO_ENABLED=0 GOOS=linux go build -v -o main . && \
    echo "Go build completed successfully"

# Final stage
FROM alpine:latest

# Install ca-certificates
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/main .
COPY --from=builder /app/.env .

# Define build argument for port
ARG APP_PORT=8080
EXPOSE ${APP_PORT}

# Run the binary
CMD ["./main"]