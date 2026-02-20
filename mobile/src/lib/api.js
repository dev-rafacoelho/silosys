import axios from "axios";
import Constants from "expo-constants";
import { getToken, getRefreshToken, saveTokens, clearTokens } from "./storage";

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ??
  Constants.manifest?.extra?.apiUrl ??
  "http://localhost:8000";

let _onAuthFail = null;
export function setOnAuthFail(cb) {
  _onAuthFail = cb;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/registro");
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${API_URL}/auth/refresh_token`,
            { refresh_token: refreshToken },
            { headers: { "Content-Type": "application/json" } }
          );
          await saveTokens(data.access_token, refreshToken, data.expires_in);
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return api(originalRequest);
        } catch {
          await clearTokens();
          if (_onAuthFail) _onAuthFail();
        }
      } else {
        await clearTokens();
        if (_onAuthFail) _onAuthFail();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
