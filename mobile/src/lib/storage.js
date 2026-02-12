import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_ACCESS = "access_token";
export const STORAGE_REFRESH = "refresh_token";

export async function getToken() {
  return AsyncStorage.getItem(STORAGE_ACCESS);
}

export async function getRefreshToken() {
  return AsyncStorage.getItem(STORAGE_REFRESH);
}

export async function saveTokens(accessToken, refreshToken) {
  await AsyncStorage.multiSet([
    [STORAGE_ACCESS, accessToken],
    [STORAGE_REFRESH, refreshToken],
  ]);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([STORAGE_ACCESS, STORAGE_REFRESH]);
}
