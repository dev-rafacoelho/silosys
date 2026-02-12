import api from "./api";
import {
  getToken,
  saveTokens as saveTokensStorage,
  clearTokens as clearTokensStorage,
} from "./storage";

export const STORAGE_ACCESS = "access_token";
export const STORAGE_REFRESH = "refresh_token";

export async function login(email, senha) {
  const { data } = await api.post("/auth/login", { email, senha });
  await saveTokensStorage(data.access_token, data.refresh_token);
  return data;
}

export async function logout() {
  await clearTokensStorage();
}

export async function isAuthenticated() {
  const token = await getToken();
  return !!token;
}
