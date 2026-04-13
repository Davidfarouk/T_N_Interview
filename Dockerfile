# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (separate layer — cached unless package.json changes)
COPY package*.json ./
RUN npm ci

# Copy source and compile TypeScript → JavaScript
# The build script also copies src/frontend → dist/frontend
COPY . .
RUN npm run build


# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Only install production dependencies (no devDependencies)
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled output from the builder stage
COPY --from=builder /app/dist ./dist

# Create the data directory for the SQLite database
RUN mkdir -p data

EXPOSE 3000

CMD ["node", "dist/server.js"]
