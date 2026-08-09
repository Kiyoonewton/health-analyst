import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.healthanalyst.app",
  appName: "Healthalyst",
  // Static SPA build output (see vite.config.mobile.ts / `bun run build:mobile`).
  webDir: "dist/client",
};

export default config;
