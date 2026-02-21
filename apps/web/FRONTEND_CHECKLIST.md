# Frontend Checklist (Medicine Kit)

## 1. Before Coding
- Confirm route and layout: does page belong to `app/(auth)` or `app/(dashboard)`?
- Reuse existing UI components from `components/ui/*` before creating new ones.
- Keep labels/messages in one language (Ukrainian in this project).

## 2. UI/UX Basics
- Page has clear title + short description (`PageShell` for dashboard pages).
- Loading/empty/error states are visible and understandable.
- Buttons have clear action text (no vague labels).
- Inputs have labels and placeholders where useful.

## 3. Theme (Light/Dark)
- Use design tokens (`bg-card`, `text-muted-foreground`, `border-border`) instead of hardcoded colors.
- Check both light and dark mode for:
  - contrast of text
  - border visibility
  - badge/status readability
- For status colors (warning/success/error), add `dark:` variants if needed.

## 4. Data & State
- No duplicated business logic across files.
- API errors are handled and shown to user.
- Success/error feedback is visible (toast + inline text if needed).
- Avoid mixing mock and real API in the same user flow without clear fallback.

## 5. Accessibility
- Every input has `Label` with `htmlFor`.
- Icon-only buttons include `sr-only` text.
- `aria-invalid` is set for invalid fields.
- Keyboard navigation works for nav/menu/dialog.

## 6. Routing & Types
- Dynamic route params use App Router shape:
  - `params: { id: string }`
- Use shared types from `types/*`.
- Avoid `any`; prefer explicit interfaces.

## 7. Validation & Forms
- Validate on both client and server for auth/critical forms.
- Show field-level errors under each input.
- Disable submit while request is pending.

## 8. Final Local Checks
- `pnpm lint`
- `pnpm exec next typegen`
- `pnpm exec tsc --noEmit`
- Quick manual check in browser:
  - login/register
  - dashboard
  - medicines list + details
  - schedule
  - profile settings
  - light/dark mode toggle

## 9. Done Criteria
- Page is not a placeholder.
- States (loading/empty/error/success) are handled.
- Works in light and dark theme.
- No lint/type errors.
