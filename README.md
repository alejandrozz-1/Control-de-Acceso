# Control de Acceso — Repsol

Aplicación web mobile-first para la gestión del control de accesos corporativos de Repsol.
React 19 · TypeScript · Vite · MUI · Supabase · PWA · Capacitor (APK).

## 📚 Documentación del proyecto

**La fuente de verdad es la bóveda Obsidian [`obsidianRepsol/`](obsidianRepsol/00-Home.md).**

- [Índice y entregables](obsidianRepsol/00-Home.md)
- [Estado global, riesgos y bloqueos](obsidianRepsol/memoria/Estado-global.md)
- [Tareas](obsidianRepsol/memoria/Tareas.md)
- [Protocolo para agentes](obsidianRepsol/08-Memoria-compartida.md)

Antes de trabajar en este repo: lee el protocolo y haz `git pull`.

## Ramas
`main` (producción) · `develop` (integración) · `feature/*` · `hotfix/*` · `release/*`
Detalles en [Estrategia Git](obsidianRepsol/07-Git-estrategia.md).

## 🐳 Docker

```bash
docker compose up --build      # http://localhost:8080
```

- La imagen (`apps/web/Dockerfile`) compila la SPA con Vite y la sirve con nginx
  (`apps/web/nginx.conf` incluye `try_files` para las rutas de `BrowserRouter`).
- Las variables `VITE_*` se inyectan en **tiempo de build** desde `.env` (valores públicos)
  o desde el entorno; en runtime no tienen efecto.
- Para probar contra **Supabase local** (necesita Docker Engine en la máquina):

```bash
npx supabase start             # API local en http://127.0.0.1:54321 (+ migraciones y seed)
VITE_SUPABASE_URL=http://127.0.0.1:54321 \
VITE_SUPABASE_ANON_KEY=<anon_que_imprime_supabase_start> \
docker compose up --build
```
