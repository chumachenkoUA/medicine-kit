# Medicine Kit

`Medicine Kit` - монорепозиторій для керування домашньою аптечкою:
- облік препаратів;
- створення користувацьких упаковок (залишки/терміни);
- курси прийому;
- авторизація та робота через JWT.

## Структура проєкту
- `apps/web` - фронтенд на `Next.js 16` (`App Router`, BFF через `app/api/*`).
- `apps/api` - бекенд на `NestJS + Prisma + PostgreSQL`.
- `docs/project.md` - короткий опис ідеї проєкту.

## Технології
- `Node.js` (рекомендовано `20+`)
- `pnpm`
- `PostgreSQL 15` (локально через Docker)
- `Prisma ORM`

## Швидкий старт

### 1. Підняти базу даних
```bash
cd apps/api
docker compose up -d
```

Контейнер підійме PostgreSQL з параметрами:
- host: `localhost`
- port: `5434`
- db: `medicine_kit`
- user: `postgres`
- password: `12345`

### 2. Налаштувати змінні оточення

`apps/api/.env`:
```env
DATABASE_URL="postgresql://postgres:12345@localhost:5434/medicine_kit?schema=public"
PORT=3000
```

`apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

Примітка: `apps/web/.env.example` вже містить базовий приклад для фронтенду.

### 3. Встановити залежності
```bash
cd apps/api
pnpm install

cd ../web
pnpm install
```

### 4. Застосувати міграції Prisma
```bash
cd apps/api
pnpm prisma migrate deploy
pnpm prisma generate
```

### 5. Запустити застосунок

Окремо в двох терміналах:

Термінал 1 (API):
```bash
cd apps/api
pnpm start:dev
```

Термінал 2 (Web):
```bash
cd apps/web
pnpm dev --port 3001
```

Відкрити: `http://localhost:3001`

## Основні команди

Backend (`apps/api`):
- `pnpm start:dev` - запуск у dev-режимі
- `pnpm test` - unit-тести
- `pnpm test:e2e` - e2e-тести
- `pnpm lint` - ESLint
- `pnpm build` - збірка

Frontend (`apps/web`):
- `pnpm dev --port 3001` - dev-сервер
- `pnpm lint` - ESLint
- `pnpm build` - production build
- `pnpm start` - запуск production build

## API (коротко)

Публічні:
- `POST /auth/register`
- `POST /auth/login`
- `GET /tabletos`
- `GET /tabletos/:id`
- `POST /tabletos/parse`

Потребують `Bearer` токен:
- `POST/PATCH/DELETE /tabletos`
- `GET/POST/PATCH/DELETE /tabletos-users`
- `GET/POST/PATCH/DELETE /courses`
- частина операцій `users`

## Поточні зауваження
- У фронтенді API-база береться з `NEXT_PUBLIC_API_URL`.
- Щоб уникнути конфлікту портів, фронтенд краще запускати на `3001`, а API на `3000`.
- У бекенді JWT secret наразі захардкожений у модулі авторизації (dev-стан).

## Ліцензія
`MIT` (див. файл `LICENSE`).
