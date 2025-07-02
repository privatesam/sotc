# Use Node.js 20 as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Copy startup script and make it executable
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Create directories for persistent data
RUN mkdir -p /app/data/uploads
RUN mkdir -p /app/data/db

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/db/database.sqlite

# Expose port
EXPOSE 5000

# Start the application
CMD ["/app/start.sh"]