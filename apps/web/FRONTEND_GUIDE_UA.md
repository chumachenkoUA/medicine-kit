# Повний опис фронтенду (UA)

## 1. Що це за проєкт
Це `Next.js 16` застосунок (`App Router`) для керування ліками:
- авторизація/реєстрація;
- дашборд із картками препаратів;
- список ліків;
- деталі ліків;
- сторінки розкладу і профілю.

## 2. Архітектура та логіка
Основний підхід зараз один:

`UI / pages -> lib/client-api/* -> app/api/* (BFF) -> Backend API`

### 2.1 Ролі шарів
- `app/api/*`: BFF-шар (Route Handlers), проксія до бекенду, валідація тіла, auth-cookie логіка.
- `lib/client-api/*`: єдиний SDK для читання/запису даних із UI та серверних сторінок.
- `lib/medicines/*`: контракти `zod`, мапери `API -> UI`, типи payload, логіка форми.
- `components/*`: презентаційні та інтерактивні UI-компоненти.
- `app/(auth)` і `app/(dashboard)`: маршрути з окремими layout-групами.
- окремий `services/*` шар для medicines прибрано, щоб не дублювати підходи.

### 2.2 Потоки даних
- Читання списку ліків:
  - `getMedicines()` -> `GET /api/tabletos` -> BFF -> `GET /tabletos` у бекенд.
- Деталі ліків:
  - `getMedicineById(id)` -> `GET /api/tabletos/[id]` -> BFF -> `GET /tabletos/:id`.
- Створення ліків:
  - `createMedicine(payload)` -> `POST /api/tabletos` -> BFF + токен -> `POST /tabletos`.

### 2.3 Авторизація
- `loginAction`/`registerAction` ідуть напряму в бекенд `auth/*`.
- При логіні access token кладеться в `httpOnly` cookie `access_token`.
- `app/(dashboard)/layout.tsx` перевіряє cookie і блокує неавторизовані маршрути.

### 2.4 Що ще не завершено (поточний стан)
- `search` і `preview` для ліків: зараз fallback в BFF (бекенд не має цих endpoint).
- `getUpcomingDoses`, `getMedicineCourses`, `getMedicineCoursesById`: повертають порожні масиви.
- `ProfileSettingsForm` і `NotificationSettings`: збереження локальне, без API профілю.

## 3. Підсумок перевірки логіки
Що добре:
- один основний шлях інтеграції через `lib/client-api` + `app/api`;
- є `zod`-контракти на критичні backend payload;
- `lint` і `tsc --noEmit` проходять;
- route groups + nested layouts використані коректно.

Що важливо пам'ятати:
- для SSR-викликів `lib/client-api/client.ts` використовує `NEXT_PUBLIC_APP_URL`, якщо він заданий; інакше fallback `http://localhost:3000`.
- щоб пошук/preview працювали реально, потрібні endpoint на бекенді.

## 4. Опис тек і файлів

### 4.1 Корінь проєкту
- `FRONTEND_API_ARCHITECTURE.md` - коротка пам'ятка по API-архітектурі.
- `FRONTEND_CHECKLIST.md` - чекліст для розробки та фінальної перевірки.
- `FRONTEND_GUIDE_UA.md` - цей детальний опис.
- `README.md` - стандартний template README від `create-next-app`.
- `components.json` - конфіг `shadcn` (аліаси, стилі, registries).
- `eslint.config.mjs` - конфіг ESLint (`next/core-web-vitals` + TypeScript).
- `next.config.ts` - базовий конфіг Next.js.
- `package.json` - залежності, scripts, метадані пакета.
- `pnpm-lock.yaml` - lockfile залежностей.
- `pnpm-workspace.yaml` - workspace-конфіг (ігнор деяких built deps).
- `postcss.config.mjs` - PostCSS плагін Tailwind v4.
- `tsconfig.json` - TypeScript-конфіг.

### 4.1.1 Приховані/службові файли
- `.env` - базовий fallback env.
- `.env.example` - приклад змінних оточення для команди.
- `.env.local` - локальні оверрайди (найвищий пріоритет локально).
- `.env.development` - значення для development режиму.
- `.env.production` - production-змінні.
- `.gitignore` - правила ігнорування (`.env*`, `.next`, build артефакти тощо).
- `next-env.d.ts` - службовий тип-файл Next.js.

### 4.2 `app/` (маршрути, layout, API handlers)
- `app/layout.tsx` - root layout; підключає theme provider і toaster.
- `app/globals.css` - токени теми, базові стилі, анімації dashboard.
- `app/page.tsx` - редірект з `/` на `/login`.
- `app/favicon.ico` - favicon.

#### `app/(auth)/`
- `app/(auth)/layout.tsx` - layout для auth-сторінок; редіректить на dashboard, якщо є токен.
- `app/(auth)/actions.ts` - server actions: login/register/logout + валідація + cookie.
- `app/(auth)/login/page.tsx` - сторінка логіну.
- `app/(auth)/register/page.tsx` - сторінка реєстрації.

#### `app/(dashboard)/`
- `app/(dashboard)/layout.tsx` - захищений layout дашборду (перевірка токена, header, контейнер).
- `app/(dashboard)/dashboard/layout.tsx` - локальний layout сегмента dashboard.
- `app/(dashboard)/dashboard/page.tsx` - головний дашборд (статуси, картки, фільтри UI).
- `app/(dashboard)/dashboard/loading.tsx` - skeleton-стан завантаження dashboard.
- `app/(dashboard)/dashboard/create-medicine/page.tsx` - сторінка створення ліків.
- `app/(dashboard)/medicines/page.tsx` - список усіх ліків.
- `app/(dashboard)/medicines/[id]/page.tsx` - деталі конкретного препарату.
- `app/(dashboard)/schedule/page.tsx` - сторінка розкладу (наразі з порожніми курсами/прийомами).
- `app/(dashboard)/profile/page.tsx` - профіль (парсить email із JWT payload).

#### `app/api/tabletos/` (BFF)
- `app/api/tabletos/route.ts` - `GET` список + `POST` створення; валідація через `zod`.
- `app/api/tabletos/[id]/route.ts` - `GET` деталі препарату по id.
- `app/api/tabletos/search/route.ts` - fallback endpoint пошуку (повертає `[]`).
- `app/api/tabletos/preview/route.ts` - fallback preview за URL.

### 4.3 `components/` (власні UI-компоненти)

#### `components/auth/`
- `components/auth/login-form.tsx` - форма входу (`react-hook-form` + server action).
- `components/auth/register-form.tsx` - форма реєстрації (`react-hook-form` + server action).

#### `components/dashboard/`
- `components/dashboard/header.tsx` - верхня навігація dashboard + logout + mode toggle.
- `components/dashboard/medicine-bento-grid.tsx` - картки ліків + modal із деталями.
- `components/dashboard/page-shell.tsx` - універсальна оболонка сторінок (title/description/action).
- `components/dashboard/page-placeholder.tsx` - простий placeholder-card.

#### `components/medicines/`
- `components/medicines/create-medicine-flow.tsx` - покроковий flow створення препарату.
- `components/medicines/medicines-list.tsx` - таблиця ліків з пошуком/сортуванням.

#### `components/profile/`
- `components/profile/profile-settings-form.tsx` - форма персональних даних (локальний save).
- `components/profile/notification-settings.tsx` - форма нагадувань (локальний save).

#### Загальні компоненти
- `components/mode-toggle.tsx` - перемикач теми.
- `components/theme-provider.tsx` - обгортка `next-themes`.

#### `components/ui/` (бібліотечні primitives)
- `components/ui/avatar.tsx` - avatar primitives + group/badge.
- `components/ui/badge.tsx` - badge variants.
- `components/ui/bento-grid.tsx` - bento grid/container/card.
- `components/ui/button.tsx` - кнопка з variant/size через `cva`.
- `components/ui/calendar.tsx` - calendar на `react-day-picker`.
- `components/ui/card.tsx` - card primitives.
- `components/ui/dialog.tsx` - dialog primitives.
- `components/ui/dropdown-menu.tsx` - dropdown primitives.
- `components/ui/input.tsx` - input primitive.
- `components/ui/label.tsx` - label primitive.
- `components/ui/popover.tsx` - popover primitives.
- `components/ui/select.tsx` - select primitives.
- `components/ui/separator.tsx` - separator primitive.
- `components/ui/sheet.tsx` - sheet/drawer primitives.
- `components/ui/skeleton.tsx` - skeleton placeholder.
- `components/ui/sonner.tsx` - toaster wrapper (іконки + theme).
- `components/ui/table.tsx` - table primitives.
- `components/ui/tabs.tsx` - tabs primitives.

### 4.4 `lib/` (утиліти, API, контракти)

#### `lib/backend/`
- `lib/backend/http.ts` - backend fetch helper + безпечний парсинг відповіді + error message helper.

#### `lib/client-api/`
- `lib/client-api/http.ts` - парсинг помилок і `parseJsonOrThrow`.
- `lib/client-api/client.ts` - універсальний API fetch (`fetchApiJson`, `fetchApiResponse`).
- `lib/client-api/medicines.ts` - єдиний medicines SDK (read/create/search/preview/courses/upcoming).

#### `lib/config/`
- `lib/config/api.ts` - `API_BASE_URL` і ключ cookie `ACCESS_TOKEN_COOKIE`.

#### `lib/medicines/`
- `lib/medicines/contracts.ts` - `zod` схеми backend payload.
- `lib/medicines/mappers.ts` - мапери між backend DTO і UI моделями.
- `lib/medicines/types.ts` - доменний тип `CreateMedicinePayload`.
- `lib/medicines/create-form.ts` - логіка форми створення (валідація/мапінг).

#### Інші утиліти
- `lib/date.ts` - форматування дат (`date-fns`, locale `uk`).
- `lib/medicine.ts` - бізнес-утиліти (low stock, expiry, status classes).
- `lib/utils.ts` - `cn()` helper (`clsx` + `tailwind-merge`).
- `lib/validation/auth.ts` - `zod` схеми логіну/реєстрації.

### 4.5 `public/`
- `public/file.svg` - статичний SVG-ресурс.
- `public/globe.svg` - статичний SVG-ресурс.
- `public/next.svg` - статичний SVG-ресурс.
- `public/vercel.svg` - статичний SVG-ресурс.
- `public/window.svg` - статичний SVG-ресурс.

### 4.6 `types/`
- `types/medicine.ts` - доменні типи препарату, курсу, дози, списків.

## 5. Що перевірено через MCP
- `shadcn` MCP:
  - `get_audit_checklist` (валідація імпортів, deps, lint, ts).
- `context7` MCP (`/vercel/next.js/v16.1.1`):
  - best practices для App Router route groups/layouts;
  - BFF proxy-підхід у Route Handlers;
  - організація структури застосунку.

## 6. Як запускати
1. Запустити бекенд (повинен відповідати на `NEXT_PUBLIC_API_URL`).
2. У `apps/web` виконати `pnpm install`.
3. Запустити `pnpm dev`.
4. Відкрити URL з консолі Next.js (зазвичай `http://localhost:3000`).
