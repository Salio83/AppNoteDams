# Stage 1: Build Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the frontend application
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies first (needed for prisma generate)
RUN npm ci

# Copy prisma schema
COPY prisma/ ./prisma/

# Generate Prisma client (requires prisma CLI from devDependencies)
RUN npx prisma generate

# Remove development dependencies to keep the image small
RUN npm prune --production

# Copy server code
COPY server/ ./server/

# Copy auth lib (needed by server)
COPY src/lib/ ./src/lib/

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "run", "start:server"]
