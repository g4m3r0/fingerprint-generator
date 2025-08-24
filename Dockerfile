# syntax=docker/dockerfile:1
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Set production environment
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --omit=dev; \
    fi

# Copy application source
COPY . .

# Ensure non-root user can read app files
RUN chown -R node:node /usr/src/app

# Switch to a non-root user for security
USER node

# Expose the port your app listens on
EXPOSE 3000

# Optional container-level healthcheck (uses your /health endpoint)
HEALTHCHECK --interval=60s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start the server
CMD ["npm", "start"]
