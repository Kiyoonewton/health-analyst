import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.healthanalyst.app",
  appName: "Healthalyst",
  // Static SPA build output (see vite.config.mobile.ts / `bun run build:mobile`).
  // Unused while `server.url` below is set — the WebView loads that remote
  // URL directly instead of these bundled files (Namy WebView PoC).
  webDir: "dist/client",
  server: {
    url: "https://www.namyapp.com/explore",
  },
};

export default config;
