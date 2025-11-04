# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./

RUN corepack enable && corepack prepare pnpm@10.19.0 --activate
RUN pnpm fetch

# ---------- build ----------
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /root/.local/share/pnpm/store /root/.local/share/pnpm/store
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.19.0 --activate
COPY . .

ARG VITE_BACKEND_BASE_URL
ARG VITE_API_BASE_PATH
ARG VITE_HEALTH_PATH
ARG VITE_GATE_BASE_PATH
ARG VITE_SESSION_HOURS
ARG VITE_SESSION_REVALIDATE_MARGIN_MIN
ENV VITE_BACKEND_BASE_URL=$VITE_BACKEND_BASE_URL \
  VITE_API_BASE_PATH=$VITE_API_BASE_PATH \
  VITE_HEALTH_PATH=$VITE_HEALTH_PATH \
  VITE_GATE_BASE_PATH=$VITE_GATE_BASE_PATH \
  VITE_SESSION_HOURS=$VITE_SESSION_HOURS \
  VITE_SESSION_REVALIDATE_MARGIN_MIN=$VITE_SESSION_REVALIDATE_MARGIN_MIN

RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM nginx:1.27-alpine AS runner
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ || exit 1
