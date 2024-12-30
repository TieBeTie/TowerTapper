# Build stage ------------------------------------------------------------------
FROM node:18-alpine as build

# Создаем непривилегированного пользователя
RUN adduser -D -u 10001 appuser

WORKDIR /app

# Copy package files
COPY package*.json ./

# Set ownership and install dependencies
RUN chown -R appuser:appuser /app && \
    npm install

# Copy source code and set ownership
COPY --chown=appuser:appuser . .

# Switch to non-root user for build
USER appuser

# Build the application
RUN npm run build

# Production stage ------------------------------------------------------------
FROM nginx:alpine

# Создаем пользователя и настраиваем права для nginx
RUN adduser -D -u 10001 appuser && \
    # Настраиваем права для директорий nginx
    chown -R appuser:appuser /var/cache/nginx && \
    chown -R appuser:appuser /var/log/nginx && \
    chown -R appuser:appuser /etc/nginx/conf.d && \
    # Создаем pid файл и настраиваем права
    touch /var/run/nginx.pid && \
    chown -R appuser:appuser /var/run/nginx.pid

# Копируем собранные файлы и устанавливаем права
COPY --from=build --chown=appuser:appuser /app/dist /usr/share/nginx/html

# Switch to non-root user
USER appuser

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
