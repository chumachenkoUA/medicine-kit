import { format, isValid, parseISO } from "date-fns"
import { uk } from "date-fns/locale"

function toDate(value: string | Date): Date | null {
  const parsed = typeof value === "string" ? parseISO(value) : value
  return isValid(parsed) ? parsed : null
}

export function formatDate(
  value: string | Date,
  pattern = "dd.MM.yyyy"
): string {
  const date = toDate(value)
  if (!date) return String(value)
  return format(date, pattern, { locale: uk })
}

export function formatDateRange(
  start: string | Date,
  end: string | Date,
  pattern = "dd.MM.yyyy"
): string {
  return `${formatDate(start, pattern)} - ${formatDate(end, pattern)}`
}
