# Multi-stage Dockerfile for BakBak backend (Node + TypeScript)

FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
# Create uploads directory (mounted via volume in docker-compose)
RUN mkdir -p ./uploads
EXPOSE 5000
CMD ["node", "dist/index.js"]
