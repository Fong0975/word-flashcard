# Multi-stage build for React frontend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --verbose --omit=dev

# Copy source code
COPY . .

# API host/port the built app should call, baked in at build time by Vite.
ARG VITE_API_HOSTNAME=localhost
ARG VITE_API_PORT=8080
ENV VITE_API_HOSTNAME=$VITE_API_HOSTNAME
ENV VITE_API_PORT=$VITE_API_PORT

# Build the application
RUN DISABLE_ESLINT_PLUGIN=true npm run build

# Install a simple server to serve the React app
RUN npm install -g serve

# Define build argument for port
ARG FRONTEND_PORT=3000
EXPOSE ${FRONTEND_PORT}

# Set the command to run the server with dynamic port
CMD serve -s build -l ${FRONTEND_PORT}