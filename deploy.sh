#!/bin/bash

# Deploy script for DockerTokenViewer
# This script builds and deploys the application

set -e

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Build the application
echo -e "${YELLOW}📦 Building application...${NC}"
yarn build:prod

# Build Docker image
echo -e "${YELLOW}🐳 Building Docker image...${NC}"
docker build -t dockertokenviewer .

# Stop existing container if running
echo -e "${YELLOW}🛑 Stopping existing container...${NC}"
docker stop dockertokenviewer-app 2>/dev/null || true
docker rm dockertokenviewer-app 2>/dev/null || true

# Run new container
echo -e "${YELLOW}🚀 Starting new container...${NC}"
docker run -d \
  --name dockertokenviewer-app \
  -p 3000:3000 \
  --restart unless-stopped \
  dockertokenviewer

# Wait for container to be ready
echo -e "${YELLOW}⏳ Waiting for application to be ready...${NC}"
sleep 5

# Check if container is running
if docker ps | grep -q dockertokenviewer-app; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}🌐 Application is running at: http://localhost:3000${NC}"
    echo -e "${GREEN}🏥 Health check: http://localhost:3000/health${NC}"
else
    echo -e "${RED}❌ Deployment failed. Container is not running.${NC}"
    docker logs dockertokenviewer-app
    exit 1
fi 