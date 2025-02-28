# Інструкції з розгортання проекту на сервері

Цей документ містить покрокові інструкції для розгортання веб-сайту на продакшн-сервері.

## Вимоги до сервера

- Node.js 18.x або вище (рекомендовано: Node.js 20.x)
- npm 9.x або вище
- Мінімум 1 ГБ оперативної пам'яті
- Мінімум 2 ГБ вільного дискового простору

## Крок 1: Підготовка проекту для розгортання

1. Переконайтеся, що всі необхідні зміни внесені до коду
2. Налаштуйте змінні середовища у файлі `.env.local`:

```
DIRECTUS_URL=https://suppinfo.directus.app
DIRECTUS_ADMIN_EMAIL=your_email@example.com
DIRECTUS_ADMIN_PASSWORD=your_password
```

3. Очистіть тимчасові файли:

```bash
rm -rf .next node_modules
```

4. Встановіть залежності:

```bash
npm install --production
```

## Крок 2: Створення продакшн білда

```bash
npm run build
```

Після успішного виконання команди у папці `.next` буде створено оптимізований білд для продакшн.

## Крок 3: Запуск на продакшн-сервері

### Варіант 1: Запуск за допомогою Node.js

```bash
npm start
```

Сайт буде доступний за адресою `http://localhost:3000`

### Варіант 2: Розгортання з використанням Docker

1. Створіть Dockerfile:

```dockerfile
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
```

2. Збудуйте Docker образ:

```bash
docker build -t product-catalog .
```

3. Запустіть контейнер:

```bash
docker run -p 3000:3000 -e DIRECTUS_URL=https://suppinfo.directus.app -e DIRECTUS_ADMIN_EMAIL=your_email@example.com -e DIRECTUS_ADMIN_PASSWORD=your_password product-catalog
```

### Варіант 3: Розгортання на Vercel

Якщо ви хочете розгорнути на Vercel:

1. Створіть обліковий запис на [Vercel](https://vercel.com)
2. Встановіть Vercel CLI:

```bash
npm install -g vercel
```

3. Авторизуйтеся:

```bash
vercel login
```

4. Розгорніть проект:

```bash
vercel --prod
```

## Оптимізація продуктивності

Для забезпечення максимальної продуктивності сайту:

1. Використовуйте CDN для статичних ресурсів
2. Налаштуйте кешування зображень на сервері
3. Налаштуйте Gzip або Brotli стиснення на рівні веб-сервера
4. Розгляньте можливість використання edge-функцій, якщо це підтримується вашим хостинг-провайдером

## Моніторинг

Для моніторингу продуктивності та доступності рекомендуємо:

1. Налаштувати New Relic або Datadog
2. Налаштувати сповіщення про відмови та помилки
3. Регулярно перевіряти метрики продуктивності

## Вирішення проблем

Якщо ви зіткнулися з проблемами під час розгортання:

1. Перевірте журнали помилок сервера
2. Переконайтеся, що всі змінні середовища правильно налаштовані
3. Перевірте доступність API Directus (https://suppinfo.directus.app)
4. Перевірте, чи є достатньо дискового простору та пам'яті на сервері 