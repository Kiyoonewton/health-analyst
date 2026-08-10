FROM node:22-alpine AS base
RUN apk add --no-cache python3 make g++

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  else echo "No lockfile found." && exit 1; \
  fi

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/db/schema.sql ./dist/db/schema.sql
COPY package.json ./

RUN mkdir -p /app/data

ENV PORT=4000
ENV DATABASE_PATH=/app/data/dev.db
EXPOSE 4000

CMD ["node", "dist/index.js"]
