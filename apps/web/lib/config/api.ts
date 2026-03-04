const serverApiUrl = process.env.API_URL?.replace(/\/$/, "")
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")

export const API_BASE_URL =
  serverApiUrl ?? publicApiUrl ?? "http://localhost:3000"

export const ACCESS_TOKEN_COOKIE = "access_token"
