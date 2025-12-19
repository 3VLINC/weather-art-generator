# Multi-stage build for production
FROM node:20-slim AS builder

# Install system dependencies required for sharp (image processing)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libvips-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:20-slim

# Install runtime dependencies for sharp
RUN apt-get update && apt-get install -y \
    libvips \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

# Create app user (non-root)
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY --chown=appuser:appuser . .

# Create directories for writable files
RUN mkdir -p svgs && \
    echo '{"count":0}' > artwork-counter.json && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
# Optional: Set BASE_PATH for subfolder deployment (e.g., BASE_PATH=/weather)
# If not set, defaults to empty string for root deployment

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]

