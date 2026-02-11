import axios from "axios";
import { getToken, getRefreshToken, saveTokens } from "./storage";

// Altere para a URL da sua API (em dispositivo físico use o IP da máquina, ex: http://192.168.1.10:8000)
const API_URL = "http://localhost:8000";

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
          // Refresh falhou; o app deve redirecionar para login (tratado pelo chamador)
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
