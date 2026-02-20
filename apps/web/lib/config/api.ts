export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000"

export const ACCESS_TOKEN_COOKIE = "access_token"
