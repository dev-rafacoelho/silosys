import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_ACCESS = "access_token";
export const STORAGE_REFRESH = "refresh_token";

export async function getToken() {
  return AsyncStorage.getItem(STORAGE_ACCESS);
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(STORAGE_REFRESH);
}

export async function saveTokens(accessToken, refreshToken, expiresIn) {
  const pairs = [
    [STORAGE_ACCESS, accessToken],
    [STORAGE_REFRESH, refreshToken],
  ];
  if (expiresIn) {
    const expiresAt = String(Date.now() + Number(expiresIn) * 1000);
    pairs.push(["token_expires_at", expiresAt]);
  }
  await AsyncStorage.multiSet(pairs);
}

export async function isTokenExpired() {
  const expiresAt = await AsyncStorage.getItem("token_expires_at");
  if (!expiresAt) return false;
  return Date.now() >= Number(expiresAt);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([STORAGE_ACCESS, STORAGE_REFRESH, "token_expires_at"]);
}
