import axios from "axios"
import { getCookie, COOKIE_ACCESS, COOKIE_REFRESH, saveTokens } from "./auth"

export const api = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use((config) => {
  const token = getCookie(COOKIE_ACCESS)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/registro")
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true
      const refreshToken = getCookie(COOKIE_REFRESH)
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            "/auth/refresh_token",
            { refresh_token: refreshToken },
            { headers: { "Content-Type": "application/json" }, baseURL: "" },
          )
          saveTokens(data.access_token, refreshToken, data.expires_in)
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`
          return api(originalRequest)
        } catch {
          if (typeof window !== "undefined") window.location.href = "/login"
        }
      } else if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

export default api
