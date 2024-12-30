#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Pull the latest images
docker-compose -f docker-compose.prod.yml pull

# Bring up the services
docker-compose -f docker-compose.prod.yml up -d --build

# Run database migrations (if any)
docker-compose -f docker-compose.prod.yml exec server /app/migrate

# Check the status of the services
docker-compose -f docker-compose.prod.yml ps
