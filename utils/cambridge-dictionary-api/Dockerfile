# Node.js service for Cambridge Dictionary API
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --verbose --omit=dev

# Copy source code
COPY . .

# Define build argument for port
ARG CAMBRIDGE_API_PORT=8081
EXPOSE ${CAMBRIDGE_API_PORT}

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Start the service
CMD ["node", "index.js"]