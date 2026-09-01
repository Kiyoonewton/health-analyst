import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.healthanalyst.app",
  appName: "Healthalyst",
  // Static SPA build output (see vite.config.mobile.ts / `bun run build:mobile`).
  webDir: "dist/client",
  server: {
    // Dev-only: the app shell normally loads over https://localhost, which
    // blocks fetches to the plain-http local backend (http://10.0.2.2:4000)
    // as mixed content. Loading the shell over http:// instead avoids that.
    androidScheme: "http",
  },
};

export default config;
