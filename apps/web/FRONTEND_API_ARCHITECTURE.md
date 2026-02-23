# Frontend API Architecture

## Data Flow
- Browser UI calls `lib/client-api/*`.
- `lib/client-api/*` calls `app/api/*` (BFF layer).
- `app/api/*` proxies requests to backend and handles auth/token forwarding.
- Server pages use the same `lib/client-api/*` module.

## Folders
- `app/api/*`: Route Handlers (BFF endpoints).
- `lib/backend/http.ts`: shared backend fetch + payload parsing.
- `lib/client-api/client.ts`: shared fetch helper for client + server.
- `lib/client-api/medicines.ts`: single medicines module for all UI calls.
- `lib/medicines/contracts.ts`: zod contracts for backend payloads.
- `lib/medicines/mappers.ts`: mapping backend DTO -> UI models.

## Why this structure
- Contracts (`zod`) detect backend shape changes early.
- Mappers isolate UI from backend naming (`Id`, `Name`, `Format`).
- Shared HTTP helpers remove duplicated error handling.
- BFF layer keeps backend integration and auth-sensitive logic server-side.

## How to add a new endpoint
1. Add/extend schema in `lib/medicines/contracts.ts`.
2. Add mapper in `lib/medicines/mappers.ts` if UI shape differs.
3. Add route handler in `app/api/.../route.ts`.
4. Add method in `lib/client-api/...`.
5. Use it in page/component and run `pnpm lint` + `pnpm exec tsc --noEmit`.
