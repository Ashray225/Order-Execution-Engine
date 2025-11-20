#!/bin/bash

# Production deployment script
echo "Starting production deployment..."

# Copy production environment
cp .env.prod .env

# Build and start services
docker-compose -f docker-compose.prod.yml up --build -d

echo "Deployment complete!"
echo "Backend running on port 3000"
echo "Database running on port 5432"
echo "Redis running on port 6379"