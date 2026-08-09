import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const TOKEN_KEY = "dental_session_token";

// Cookies don't reliably survive the cross-origin hop from a Capacitor
// WebView (capacitor://localhost / https://localhost) to the API's real
// origin, so native builds carry the JWT explicitly and send it as a
// Bearer header instead. Web keeps using the httpOnly cookie exclusively.
export const isNative = Capacitor.isNativePlatform();

let cached: string | null = null;

export async function getToken(): Promise<string | null> {
  if (!isNative) return null;
  if (cached !== null) return cached;
  const { value } = await Preferences.get({ key: TOKEN_KEY });
  cached = value ?? null;
  return cached;
}

export async function setToken(token: string | null): Promise<void> {
  if (!isNative) return;
  cached = token;
  if (token) {
    await Preferences.set({ key: TOKEN_KEY, value: token });
  } else {
    await Preferences.remove({ key: TOKEN_KEY });
  }
}
