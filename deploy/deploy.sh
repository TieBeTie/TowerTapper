#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

sudo apt update && sudo apt upgrade -y

sudo apt install -y docker-compose

sudo usermod -aG docker $USER
sudo chmod 666 /var/run/docker.sock
# Pull the latest images
docker-compose pull

# Bring up the services
docker-compose up -d --build

# Run database migrations (if any)
docker-compose exec server /app/migrate

# Check the status of the services
docker-compose ps
