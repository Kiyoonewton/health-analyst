// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
//
// Mobile-only build config for the Capacitor wrapper: produces a static,
// client-only SPA bundle (no live SSR server, since Capacitor loads static
// files from disk into a native WebView). The regular web build stays SSR
// via vite.config.ts and is untouched by this file.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // No deployable server bundle for the mobile build — Capacitor only needs
  // the static shell + client assets, and the Nitro/Cloudflare adapter is
  // what breaks SPA-mode's built-in shell prerender (wrong output path).
  nitro: false,
  tanstackStart: {
    spa: { enabled: true },
  },
});
