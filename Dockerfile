FROM node:20-alpine AS base

# Встановлення залежностей для продакшн
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Побудова проекту
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Продакшн образ
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Копіювання необхідних файлів
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Відкриття порту та запуск
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"] 