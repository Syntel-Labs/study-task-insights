FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

# deps
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# prisma generate
FROM deps AS build
WORKDIR /app
COPY prisma ./prisma
RUN pnpm exec prisma generate

# runtime
FROM base AS runner
WORKDIR /app
ENV PORT=3000
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY --from=build /app/generated ./generated
EXPOSE 3000
CMD ["node", "src/server.js"]
