# Dockerfile for NYS Virtual Campus API
# Builds the project and runs the bundled server at dist/server/index.js
FROM node:18-alpine as builder

WORKDIR /app

# Copy package manifests and install full dependencies (including dev) for build tools
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build the project (this requires dev deps like esbuild)
COPY . .
RUN npm run build

# Final image: install only production deps for smaller runtime image
FROM node:18-alpine
WORKDIR /app

# Copy package manifests and install production deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy build output
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 5000

# Start the bundled server
CMD ["node", "dist/server/index.js"]
