# Estado global del proyecto

> Última actualización: 2026-10-28 (sesión 2) — por: coordinador

## Salud general
🟡 Fase 0 completada + Fase 1 (auth) en marcha: login/guardas/invitación funcionales. Pendiente: cuota email free (2/h sin SMTP), alta CSV, CRUD centros/equipos.

## Riesgos activos
Definición completa en [[10-Riesgos]].

| ID | Riesgo | Estado |
|---|---|---|
| R-01 | MCP Supabase sin permisos | 🟢 Mitigado: se usa token `SUPABASE_ACCESS_TOKEN` + `scripts/apply-migrations.mjs` (Management API). El MCP sigue sin permisos (no bloquea) |
| R-02 | Formato de QR esperado por tornos Repsol desconocido | 🟡 Verificar en Fase 2 (ADR-003) |
| R-03 | Escala >5.000 | 🟡 Índices + triggers listos; MV de métricas en Fase 5 |
| R-06 | Assets/tipografía de marca sin confirmar | 🟡 Pendiente cliente |
| R-08 | Conflictos entre agentes | ⚪ No aplica todavía (un solo agente activo) |
| R-10 | Free tier Supabase | ⚪ Vigilar en Fase 5 |
| R-11 | Clave privada VAPID y token Supabase deben vivir solo en secretos (Vercel/GitHub), nunca en el repo | 🟡 Acción del usuario (ver C-005) |
| R-12 | `password_hibp_enabled` (leaked password protection) **no activable: plan Free** (Management API → 402 "Pro Plans and up"). Mitigación: `password_min_length=6` por defecto + validación de fuerza en el frontend al crear/invitar usuarios; reevaluar al subir de plan | 🟡 Aceptado (plan Free) |
| R-13 | Email rate limit plan Free = **2 envíos/hora** (`rate_limit_email_sent`) y no se puede subir sin SMTP custom → invitaciones de admin limitadas. Mitigación: mensaje claro en UI (`limite_invitaciones_alcanzado`); subir a SMTP custom (decisión cliente) | 🟡 Aceptado (plan Free) |
| R-14 | Build 230 kB gzip (subió con MUI Table/Dialog + TanStack Query). Mitigación: lazy-load de rutas admin en Fase 2 | 🟡 Vigilar |

## Bloqueos

| ID | Bloqueo | Estado |
|---|---|---|
| B-01 | ~~MCP Supabase sin permisos~~ | ✅ **Resuelto 2026-10-28**: token de proyecto facilitado por el usuario; migraciones vía Management API (`scripts/apply-migrations.mjs`), registradas en `supabase_migrations` para compatibilidad con la CLI |
| B-02 | Repo GitHub vacío / secretos | 🟡 **Parcial**: repo con `main`+`develop` publicados. Pendiente: secret `SUPABASE_ACCESS_TOKEN` en GitHub Actions (T-027) y variables de entorno en Vercel (usuario) |

## Dependencias
- Cliente → assets de marca, contrato de QR con tornos, keystore Android, **configurar en Vercel**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (ver C-005).
- QA → tests e2e requieren Fase 1 (auth) operativa.

## Estado de la infraestructura (2026-10-28)

| Componente | Estado |
|---|---|
| Supabase `bipcvxetgypugwnbhmwm` (eu-central-1) | ✅ 16 tablas, RLS 16/16, advisors **0 ERROR** / 6 WARN aceptados + 1 WARN plan free (R-12), seed aplicado |
| Migraciones | ✅ 8 archivos `2026102800000X_*.sql`, idempotentes, vía `node scripts/apply-migrations.mjs` |
| Edge Functions | ✅ `invite-user` desplegada (verificada: 401/403/200) |
| Auth (GoTrue) | ✅ Login verificado con usuarios seed. **Lección**: insertar usuarios directamente en `auth.users` exige normalizar columnas token a `''` (NULL → `Scan error` en GoTrue) — ya en el seed |
| App web (apps/web) | ✅ `lint+typecheck+test+build` en verde (5 tests); build 230 kB gzip (R-14) |
| CI | ✅ `ci.yml` en develop/main (advisors con secret, si no → skip) |
| PWA / Capacitor | ⬜ Fases 6 |
