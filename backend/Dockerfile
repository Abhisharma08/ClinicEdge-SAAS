# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy only what's needed for production
COPY --chown=nestjs:nodejs --from=builder /app/dist ./dist
COPY --chown=nestjs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nestjs:nodejs --from=builder /app/package*.json ./
COPY --chown=nestjs:nodejs --from=builder /app/prisma ./prisma

# Switch to non-root user
USER nestjs

EXPOSE 3001

# Run migrations then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
