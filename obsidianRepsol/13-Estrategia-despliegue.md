# Estrategia de despliegue web

## Opción A: Docker (imagen propia)

- `apps/web/Dockerfile` (build multi-etapa: Node compila → nginx sirve) + `apps/web/nginx.conf`
  (fallback `try_files` para `BrowserRouter`) + `docker-compose.yml` en la raíz.
- Build: `docker compose up --build` → `http://localhost:8080`. Las `VITE_*` se inyectan **en build**
  (`.env` del repo o entorno); contra Supabase local usar `npx supabase start` y sobrescribirlas.
- El build se ejecuta en la VM de Azure (la máquina de desarrollo no tiene Docker Engine).

## Opción B: Vercel (decidida con el PO)

| Entorno | Rama | URL | Contenido |
|---|---|---|---|
| Preview | todo PR → `develop` | `control-de-acceso-git-<rama>.vercel.app` | build de PR |
| Staging | `develop` | `/staging` o dominio dedicado | seed de prueba |
| Producción | `main` | dominio definitivo (a definir con cliente) | datos reales |

## CI/CD (GitHub Actions + Vercel)

**`ci.yml`** (PR a develop/main): install → `lint` → `typecheck` → `test` → `build` → si cambia `supabase/`: `supabase db lint` + advisors.

**`deploy.yml`**: Vercel Git integration (despliegue automático por rama). Alternativa con Actions + token si se prefiere control total — decisión registrada en Comunicaciones.

**`supabase-migrate.yml`** (manual, `workflow_dispatch`): `supabase db push` contra el entorno indicado con `SUPABASE_ACCESS_TOKEN`. Producción solo con tag `v*`.

## Variables y secretos
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` → vars de entorno Vercel (la anon key es pública por diseño; la protección real es RLS).
- `SUPABASE_ACCESS_TOKEN`, `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY` → GitHub Secrets (solo en Actions/Edge Functions, **nunca** en el bundle).

## Headers de seguridad (Vercel `vercel.json`)
```json
{ "headers": [
  { "source": "/(.*)", "headers": [
    { "key": "Content-Security-Policy",
      "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fcm.googleapis.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
    { "key": "X-Content-Type-Options", "value": "nosniff" },
    { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
    { "key": "Permissions-Policy", "value": "camera=(self), microphone=(), geolocation=()" },
    { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
  ]}
]}
```
> CSP `connect-src` debe incluir el dominio real del proyecto Supabase (ver R-01: confirmar URL con MCP habilitado).

## Rollback
- Cualquier deploy anterior se restaura desde el dashboard de Vercel en 1 clic; tags en `main` = builds históricos.
