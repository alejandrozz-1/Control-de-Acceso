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
- **Playwright MCP fix**: Instaló `@vitest/browser-playwright` y `playwright` que estaban listados en `package-lock.json` pero no instalados. Arregló el test `notifications-ui.test.tsx` que esperaba un heading `"Hoy"` pero la UI muestra `"Notificaciones"`.
- Las variables `VITE_*` se inyectan en **tiempo de build** desde `.env` (valores públicos)
  o desde el entorno; en runtime no tienen efecto.
- La administración de usuarios usa la Edge Function `admin-users` y una migración nueva.
  Para crear cuentas y enviar activaciones, aplica las migraciones, despliega la función y
  configura en Supabase los secrets `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (remitente de un
  dominio verificado en Resend) y `APP_URL` (URL HTTPS pública de la aplicación). No pongas
  esos secretos en `VITE_*` ni en el navegador. El usuario recibe contraseña temporal y código
  de seis dígitos; la activación requiere iniciar sesión, validar el código y establecer una
  contraseña nueva. Los códigos caducan a las 24 horas.

  ```bash
  npx supabase functions deploy admin-users
  npx supabase functions deploy invite-user
  npx supabase secrets set RESEND_API_KEY=<clave> RESEND_FROM_EMAIL="Control de Accesos Repsol <no-reply@dominio-verificado>" APP_URL=https://<url-publica>
  ```
  `invite-user` queda deshabilitada (HTTP 410) para que clientes antiguos no puedan saltarse el nuevo flujo de activación.
  Deshabilita también el registro público en **Supabase Auth → Settings** (el entorno local ya lo hace); el trigger de perfiles ignora roles y centros enviados por registros no administrados y bloquea esas cuentas.

  Seguridad y Recursos Humanos se registran como roles de permisos básicos, sin acceso al panel
  de administración. La app muestra el último inicio de sesión desde Supabase Auth.
- Para probar contra **Supabase local** (necesita Docker Engine en la máquina):

```bash
npx supabase start             # API local en http://127.0.0.1:54321 (+ migraciones y seed)
VITE_SUPABASE_URL=http://127.0.0.1:54321 \
VITE_SUPABASE_ANON_KEY=<anon_que_imprime_supabase_start> \
docker compose up --build
```
