<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/pill.svg" width="100" height="100" alt="Medicine Kit Logo">
  <h1>💊 Medicine Kit</h1>
  <p><i>Ваш розумний помічник для ведення домашньої аптечки</i></p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/Next.js-16.1-black?logo=next.js" alt="Next.js">
    <img src="https://img.shields.io/badge/NestJS-11.1-ea2845?logo=nestjs" alt="NestJS">
    <img src="https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql" alt="PostgreSQL">
    <img src="https://img.shields.io/badge/Docker-Ready-2496ed?logo=docker" alt="Docker">
  </p>
</div>

---

## 📖 Про проєкт

**Medicine Kit** — це повноцінний вебзастосунок для керування домашньою аптечкою. Цей пет-проєкт розроблено з метою практики сучасних технологій та створення корисного інструменту для повсякденного життя. 

Більше ніяких прострочених ліків або забутих прийомів! Застосунок допомагає організувати зберігання препаратів, контролювати їх залишки та планувати курси лікування.

## ✨ Головні можливості

- 📦 **Інвентаризація:** Додавання та зберігання інформації про всі ваші ліки.
- 📊 **Контроль залишків:** Відстеження кількості препаратів та попередження про ті, що закінчуються.
- ⏰ **Терміни придатності:** Автоматичні сповіщення про ліки, термін придатності яких вийшов.
- 🗓️ **Планування прийомів:** Створення курсів лікування з детальним графіком.
- ✅ **Відстеження:** Можливість відмічати прийняті ліки (нагадування та логування).

## 🛠 Технологічний стек

Проєкт побудовано як монорепозиторій з використанням сучасних інструментів:

### Frontend (`apps/web`)
- [Next.js](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- [React Query](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

### Backend (`apps/api`)
- [NestJS](https://nestjs.com/)
- [Prisma ORM](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- JWT Authentication

### Інфраструктура та Інструменти
- [Docker](https://www.docker.com/) & Docker Compose
- [pnpm](https://pnpm.io/) (Package Manager)
- TypeScript

## 🚀 Швидкий старт

### Передумови
Переконайтеся, що у вас встановлені:
- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/installation)
- [Docker](https://www.docker.com/get-started) (для розгортання через контейнери)

### 🐳 Запуск через Docker (Рекомендовано)

Це найпростіший спосіб запустити весь проєкт (базу даних, бекенд та фронтенд) одночасно.

1. Клонуйте репозиторій:
   ```bash
   git clone https://github.com/chumachenkoUA/medicine-kit.git
   cd medicine-kit
   ```
2. Запустіть контейнери:
   ```bash
   pnpm start
   ```
3. Відкрийте браузер:
   - Фронтенд: `http://localhost:3001`
   - API: `http://localhost:3000`
4. Для зупинки контейнерів:
   ```bash
   pnpm stop
   ```

### 💻 Запуск для розробки (Development)

Якщо ви хочете вносити зміни в код:

1. Встановіть залежності для кожного застосунку:
   ```bash
   pnpm -C apps/api install
   pnpm -C apps/web install
   ```
2. Налаштуйте базу даних (наприклад, підніміть тільки Postgres через Docker):
   ```bash
   docker compose up db -d
   ```
3. Налаштуйте змінні середовища `.env` у теках `apps/api` та `apps/web` (скопіюйте з `.env.example`, якщо є).
4. Застосуйте міграції БД для бекенду:
   ```bash
   pnpm -C apps/api exec prisma db push
   pnpm -C apps/api exec prisma generate
   ```
5. Запустіть проєкт в режимі розробки:
   - Для бекенду (`apps/api`): `pnpm -C apps/api start:dev`
   - Для фронтенду (`apps/web`): `pnpm -C apps/web dev`

## 📂 Структура проєкту

```text
medicine-kit/
├── apps/
│   ├── api/       # NestJS Backend застосунок
│   └── web/       # Next.js Frontend застосунок
├── docs/          # Документація проєкту
├── docker-compose.yml
└── package.json
```

## 🤝 Автори

Цей проєкт створено двома ентузіастами для покращення навичок розробки та полегшення життя:
- **[Чумаченко Дмитро]** — *Frontend Developer* ([GitHub](https://github.com/chumachenkoUA))
- **[Осипенко Роман]** — *Backend Developer* ([GitHub](https://github.com/Soms01))

*Якщо вам сподобався проєкт, не забудьте поставити ⭐️!*
