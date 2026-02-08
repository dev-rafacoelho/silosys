import api from "./api"

export const COOKIE_ACCESS = "access_token"
export const COOKIE_REFRESH = "refresh_token"

const COOKIE_MAX_AGE_ACCESS = 60 * 60 * 24 * 7
const COOKIE_MAX_AGE_REFRESH = 60 * 60 * 24 * 30

export function getCookie(name) {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? decodeURIComponent(match[2]) : null
}

export function setCookie(name, value, maxAge) {
  if (typeof document === "undefined") return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function removeCookie(name) {
  if (typeof document === "undefined") return
  document.cookie = `${name}=; path=/; max-age=0`
}

export function saveTokens(accessToken, refreshToken, expiresIn) {
  setCookie(COOKIE_ACCESS, accessToken, expiresIn || COOKIE_MAX_AGE_ACCESS)
  setCookie(COOKIE_REFRESH, refreshToken, COOKIE_MAX_AGE_REFRESH)
}

export function clearTokens() {
  removeCookie(COOKIE_ACCESS)
  removeCookie(COOKIE_REFRESH)
}

export async function login(email, senha) {
  const { data } = await api.post("/auth/login", { email, senha })
  saveTokens(data.access_token, data.refresh_token, data.expires_in)
  return data
}

export function logout() {
  clearTokens()
  window.location.href = "/login"
}
