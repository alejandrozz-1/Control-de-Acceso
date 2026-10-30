# Construye la SPA (Vite) y la sirve con nginx + fallback SPA.
FROM node:22-alpine AS build
WORKDIR /app

# Monorepo con workspaces: basta con los package.json.
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY . .

# Variables de build de Vite (en tiempo de build, no de runtime).
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_VAPID_PUBLIC_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY

RUN npm run build -w control-acceso-web

FROM nginx:1.29-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
