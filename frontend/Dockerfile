FROM oven/bun:1-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Work around a TanStack Start + Nitro node-server build bug: the router's
# start-manifest virtual module gets resolved twice across build phases, and
# the runtime import (`_tanstack-start-manifest_v.mjs`, no hash) ends up with
# the dev-mode placeholder (`/@id/virtual:tanstack-start-dev-client-entry`)
# instead of the real client bundle path, breaking hydration entirely. The
# correct manifest is still produced as a sibling hashed file that nothing
# imports at runtime — copy its content over the broken one.
RUN cd .output/server && \
    hashed=$(ls _tanstack-start-manifest_v-*.mjs) && \
    cp "$hashed" _tanstack-start-manifest_v.mjs && \
    grep -q 'virtual:tanstack-start-dev-client-entry' _tanstack-start-manifest_v.mjs && \
    { echo "start-manifest workaround failed: dev entry still present"; exit 1; } || true

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=builder /app/.output ./.output

EXPOSE 3000
CMD ["bun", "run", ".output/server/index.mjs"]
