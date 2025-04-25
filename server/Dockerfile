# Build stage ------------------------------------------------------------------
FROM golang:1.21-alpine

# Создаем непривилегированного пользователя
RUN adduser -D -u 10001 appuser

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download all dependencies
RUN go mod download

# Copy the source code
COPY . .

# Production stage ------------------------------------------------------------ 
# Build the application and set permissions
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/bot &&\
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port 8080 for the server
EXPOSE 8080

# Command to run the executable
CMD ["./main"] 