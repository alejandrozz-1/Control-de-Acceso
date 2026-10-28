# Registro de cambios (append-only)

> Cada cierre de tarea añade una fila. Nunca se borran filas.

| Fecha | Agente | Qué cambió | Dónde | Tarea |
|---|---|---|---|---|
| 2026-10-28 | coordinador | Creación de la bóveda completa: 13 entregables, 4 ADRs, protocolo de memoria, estructura de tareas/riesgos/comunicaciones | `obsidianRepsol/` (23 archivos) | T-000 |
| 2026-10-28 | coordinador | Verificación de identidad Repsol 2025 (nueva marca junio-2025: degradado naranja→magenta, tipografía en minúscula, marfil) y justificación de tokens en [[04-Diseno-UX-UI]] | `obsidianRepsol/04-Diseno-UX-UI.md` | T-000 |
| 2026-10-28 | coordinador | Registro de bloqueos B-01 (MCP Supabase sin permisos) y B-02 (repo vacío) | `obsidianRepsol/memoria/Estado-global.md` | T-000 |
| 2026-10-28 | devops/backend | Desbloqueo B-01 con token del usuario: `scripts/apply-migrations.mjs` vía Management API | `scripts/`, `obsidianRepsol/memoria/Comunicaciones.md` (C-002) | T-002 |
| 2026-10-28 | backend | 8 migraciones aplicadas al proyecto `bipcvxetgypugwnbhmwm` (16 tablas, RLS 16/16, triggers de turnos/auditoría/aprobaciones); endurecimiento advisors (0 ERROR) | `supabase/migrations/` | T-003 |
| 2026-10-28 | backend | Seed determinista aplicado y verificado (10 usuarios, 3.564 `shift_entries` autogenerados, 60 `access_logs`, 19 `audit_logs`) | `supabase/seed.sql` | T-004 |
| 2026-10-28 | frontend | Scaffold de la app: Vite+React 19+MUI con tokens Repsol, tema claro/oscuro, router y BottomNavigation de 5 destinos; 2 smoke tests | `apps/web/` | T-005 |
| 2026-10-28 | devops | CI (lint, typecheck, test, build + advisors con secret) | `.github/workflows/ci.yml` | T-006 |
| 2026-10-28 | devops | Par VAPID generado; `.env.example` documentado; CODEOWNERS + plantilla de PR | `.env.local`(secreto), `.env.example`, `.github/` | C-005 |
| 2026-10-28 | backend | Fixes durante puesta en marcha: precedencia `\|\|` vs `->>` en `fn_audit`, `generate_series` 3-argos en `fn_generate_shift_entries` (ambos idempotentes ya re-aplicados) | `supabase/migrations/20261028000004_*`, `*0007_*` | T-003 |
| 2026-10-28 | frontend | T-007: `database.types.ts` generado (`supabase gen types`, convertido a UTF-8) | `apps/web/src/services/database.types.ts` | T-007 |
| 2026-10-28 | frontend | Fase 1 auth: store `services/auth.ts` (Zustand + `initAuth`), guardas `app/guards.tsx` (`RequireAuth`/`RequireRole`), página `Login`, `Cuenta` con perfil+logout, `admin/Usuarios` (listado + invitación), router protegido | `apps/web/src/` | T-008 |
| 2026-10-28 | backend | Edge Function `invite-user` (verifica rol admin con service_role antes de `inviteUserByEmail`) desplegada y verificada: 401 sin/inválido JWT, 403 empleado, 200 admin | `supabase/functions/invite-user/` | T-008 |
| 2026-10-28 | backend | **Fix crítico GoTrue**: usuarios seed insertados directamente tenían columnas token `NULL` en `auth.users` → `Scan error ... converting NULL to string` en login/admin (500). Normalización a `''` aplicada en BD y añadida al final de `seed.sql` | `supabase/seed.sql` + SQL directo | T-008 |
| 2026-10-28 | devops | `.env` (valores públicos) commiteado para que CI/tests arranquen; `.env.local` sigue gitignored; BOM eliminado de ambos (rompía la CLI de Supabase) | `.env`, `.gitignore` | T-006 |
| 2026-10-28 | devops | `auth_leaked_password_protection` no activable en plan Free (402) → R-12; email rate limit 2/h sin SMTP → R-13 | `obsidianRepsol/memoria/Estado-global.md` | — |
| 2026-10-28 | frontend-ux | Edge Function `issue-qr`: QR firmado HMAC (`credential_id.exp.firma`, TTL 60 s, sin PII) + código temporal 8 díg. (5 min); rate limit 10/min/usuario; verificada 401 sin JWT / 200 con sesión | `supabase/functions/issue-qr/` | T-010 |
| 2026-10-28 | frontend-ux | Servicio `access.ts` (invoke de issue-qr, errores amigables) + helpers `secondsUntil`/`formatCountdown` con test | `apps/web/src/services/access.ts`, `src/test/access.test.ts` | T-010/T-011 |
| 2026-10-28 | frontend-ux | Pantalla Acceso funcional: QR real (lib `qrcode`, colores de marca), countdown 1 s con aria-live, chip Activa/Caducada, código temporal con countdown propio; renueva 5 s antes de caducar | `apps/web/src/pages/Acceso.tsx` | T-011 |
| 2026-10-28 | frontend-ux | Pass UI/UX (`/ui-ux-pro-max` + iteración Playwright 375 px claro/oscuro): Inicio con saludo+fecha+turno de hoy (skeleton/empty/error role=alert), Login con barra de marca+autofoco+role=alert, `phase` opcional en PageLayout, favicon SVG | `apps/web/src/pages/{Inicio,Login}.tsx`, `components/ui/PageLayout.tsx`, `public/favicon.svg` | T-029 |
| 2026-10-28 | frontend-ux | Pass UI/UX estilo Waylet (referencia `index.html` de palo623): componente `RepsolFlame`, `brand.gradient` + feedback táctil en tema, cabecera Inicio con degradado+llama+avatar+reloj en vivo+chip de estado, barra de progreso de jornada (`shiftProgress`, soporta noche, con test), Login con cabecera de marca, esquinas de visor en QR | `apps/web/src/app/theme.ts`, `components/ui/RepsolFlame.tsx`, `pages/{Inicio,Login,Acceso}.tsx`, `src/test/access.test.ts` | T-030 |

### Plantilla
```
| YYYY-MM-DD | <agente> | <qué> | <archivo/PR/commit> | T-0xx |
```

- **2026-10-28 · frontend-ux** · T-015/T-031: vista Calendario real (mes, leyenda M/T/N/L, festivos, eventos, vacaciones, detalle por día, skeleton/error/vacío) + onboarding first-login (diálogo 3 pasos, localStorage) + migración 20261028000007_calendar_demo_data.sql (festivos 2026, 9 vacaciones, 5 eventos) + seed con histórico de turnos -180 días. 15 tests verdes.
