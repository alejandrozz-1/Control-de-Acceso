# Tareas

> Añade filas; no borres las finalizadas (append-only). Formato: `ID | Tarea | Agente | Estado | Notas`.

## ⬜ Pendiente

| ID | Tarea | Agente | Notas |
|---|---|---|---|
| T-007 | ~~Tipos generados de BD (`database.types.ts`)~~ | Frontend/Backend | ✅ `npx supabase gen types` → `apps/web/src/services/database.types.ts` (16 tablas + funciones) |
| T-008 | ~~Auth: login, guardas por rol, invitación por email~~ | Backend+Frontend | ✅ Login+guardas+Edge Function `invite-user` (2026-10-28). **Falta**: alta CSV y reintentar invitación free (rate limit 2/h sin SMTP) |
| T-009 | Centro/equipos CRUD (admin) | Backend+Frontend | |
| T-010 | ~~Credenciales: Edge Function QR firmado + código temporal~~ | Backend+Frontend | ✅ Edge Function `issue-qr` desplegada y verificada (401 sin JWT, 200 QR firmado HMAC + temporal 8 díg.). TTL QR 60 s, temporal 300 s, rate limit 10/min/usuario (2026-10-28, frontend-ux) |
| T-011 | ~~Pantalla Acceso (QR fullscreen, temporizador, estado)~~ | Frontend | ✅ QR real (payload firmado), countdown 1 s, chip Activa/Caducada, código temporal con su countdown, estados carga/error con role=alert; verificado con Playwright 375 px claro/oscuro (2026-10-28, frontend-ux) |
| T-012 | Revocación individual/masiva + auditoría | Backend+Frontend | US-03 |
| T-013 | Limpiar/regenerar `shift_entries` al editar asignaciones (limpieza de obsoletos) + patrones UI | Backend | Gen. automática ya funciona (trigger) |
| T-014 | Festivos + eventos: UI admin | Backend+Frontend | Tablas y RLS listos |
| T-015 | ~~Vista Calendario (mes, leyenda, turnos, festivos, eventos, vacaciones)~~ | Frontend | Hecho. Vista mes mobile-first con turnos por color, festivos, eventos y vacaciones; detalle por día; skeleton/error/vacío; 2 tests de monthWeeks; verificado Playwright 375 px claro/oscuro (2026-10-28, frontend-ux) |
| T-016 | ~~Vacaciones: solicitud + aprobación líder + notificación~~ | Backend+Frontend | ✅ Solicitud con cálculo de días, anulación propia, panel «Pendientes de tu equipo» con aprobar/rechazar (RLS+trigger validan en servidor), notificación automática al decidir. Verificado Playwright: empleado→líder→notificación (2026-10-29, frontend-ux) |
| T-017 | ~~Centro de notificaciones + badge + Realtime~~ | Frontend+Backend | ✅ Lista agrupada Hoy/Ayer, no leídas destacadas, marcar individual/todas, badge en BottomNav, realtime via postgres_changes (migración 20261029000001). Verificado con INSERT remoto sin recargar (2026-10-29, frontend-ux) |
| T-018 | Web Push VAPID (Edge Function + SW) | DevOps+Frontend | Par VAPID generado (ver Comunicaciones C-005) |
| T-019 | Registros de acceso + horarios entrada/salida + CSV | Backend+Frontend | US-07 |
| T-020 | Métricas de asistencia (dashboard) | Backend+Frontend | US-10 (vista base lista) |
| T-021 | PWA: manifest + SW + instalabilidad | Frontend | [[11-Estrategia-PWA]] |
| T-022 | Capacitor: config + build APK debug en CI | Frontend+DevOps | [[12-Estrategia-Capacitor]] |
| T-023 | Seguridad: headers Vercel (CSP), checklist OWASP, rate limit Edge | DevOps+QA | [[13-Estrategia-despliegue]] |
| T-024 | E2E Playwright flujos críticos + axe | QA | [[09-Plan-de-testing]] |
| T-025 | Despliegue preview/staging/producción Vercel | DevOps+usuario | Usuario hospeda Vercel (decisión C-005) |
| T-026 | Confirmar assets de marca (brandcenter) | UX/UI+cliente | R-06 |
| T-027 | Secretos GitHub: `SUPABASE_ACCESS_TOKEN` para job CI de advisors | DevOps | Sin secret, el job hace skip |
| T-028 | pgTAP tests de RLS (rol no autorizado → vacío) | QA | [[09-Plan-de-testing]] §1 |

## 🔄 En curso

| ID | Tarea | Agente | Desde | Plan (qué toco / qué NO toco) |
|---|---|---|---|---|
| T-014 | Festivos + eventos: UI admin | frontend-ux | 2026-10-29 | **Toco:** nueva ruta `/admin/festivos` (RequireRole responsable+) con alta/baja de festivos (nacional/comunidad) y eventos corporativos, enlace desde Cuenta; estados vacío/error; tests de helpers de fecha. **NO toco:** RLS/migraciones (holidays_write y events_write ya existen y son admin-only), seed, BottomNav (5 destinos fijos). |
| T-012 | Revocación de credenciales (individual/masiva) + auditoría | frontend-ux | 2026-10-29 | **Toco:** ruta `/admin/credenciales` (listado con usuario+estado, selección múltiple, revocar con confirmación; el trigger `fn_notify_credential_revoked` y `audit_logs` ya notifican/registran), enlace desde Cuenta. **NO toco:** Edge Function `issue-qr` (ADR-003 intacto), RLS/migraciones, pantalla Acceso del empleado. |
| T-033 | Rediseño de Cuenta y destinos de configuración | frontend | 2026-10-29 | **Toco:** pantalla Cuenta, rutas/páginas de perfil, idioma, seguridad y ayuda, selección de Cuenta en BottomNav para rutas anidadas, validación y pruebas de cambio de contraseña. **NO toco:** esquema/RLS, Edge Functions, roles ni otros destinos de navegación. |

> Ejemplo de fila: | T-0xx | Título | frontend-ux | 2026-10-29 | Toco: X, Y. NO toco: Z (depende de cliente) |

> **Regla (protocolo):** esta fila se escribe y se commitea (docs(obsidian): <agente> toma tarea <id> — <plan>) **antes** de tocar código de la app. Ver [[08-Memoria-compartida]].
| T-032 | Notificaciones: lista de avisos con diferencia visual leído/no leído, contador en badge, acciones marca leída/todas, enlaces a calend/vac/acceso, actualización en tiempo real, mensaje cuando no hay avisos | Frontend+Backend | 2026-10-29 | Conservado de cambios locales |


> **Notas históricas (2026-10-28, frontend-ux):** T-030 (pass UI/UX estilo Waylet) finalizada. T-010/T-011/T-029 finalizadas. Libres entonces: T-009, T-012..T-028 (salvo T-010).
> 
> **Nota para otras IAs (2026-10-29):** T-016/T-017 finalizadas por *frontend-ux* (ver ✅ Finalizada). Libres: T-009, T-012..T-028 (salvo T-010). Si queréis una de estas, marcadla aquí antes de empezar.
## ✅ Finalizada

| ID | Tarea | Agente | Fecha |
|---|---|---|---|
| T-000 | Fase inicial: 13 entregables + 4 ADRs + memoria | coordinador | 2026-10-28 |
| T-001 | Repo: `main`+`develop`, README→Obsidian, `.gitignore`, CODEOWNERS, plantilla PR, push inicial | DevOps | 2026-10-28 |
| T-002 | Desbloqueo Supabase (B-01): token de acceso + `scripts/apply-migrations.mjs` | DevOps/backend | 2026-10-28 |
| T-003 | Migraciones 0001-0008 aplicadas: 16 tablas, RLS 16/16, advisors **0 ERROR** | Backend | 2026-10-28 |
| T-004 | `supabase/seed.sql` determinista aplicado y verificado (10 usuarios, 3.564 turnos, 60 logs) | Backend | 2026-10-28 |
| T-005 | Scaffold Vite + React 19 + MUI (tema claro/oscuro Repsol) + router + BottomNav 5 destinos | Frontend | 2026-10-28 |
| T-006 | CI `.github/workflows/ci.yml` (lint, typecheck, test, build, advisors) | DevOps | 2026-10-28 |
| T-006b | Smoke tests (2) en verde + build 134 kB gzip | QA/Frontend | 2026-10-28 |
| T-007 | `database.types.ts` generado con `supabase gen types` (UTF-8) | Frontend | 2026-10-28 |
| T-008a | Fase 1 auth: store Zustand + `initAuth`, Login, `RequireAuth`/`RequireRole`, Cuenta con logout, admin Usuarios (listado+invitación) | Frontend | 2026-10-28 |
| T-008b | Edge Function `invite-user` desplegada y verificada (401 sin JWT, 403 no-admin, 200 admin) | Backend | 2026-10-28 |
| T-008c | Fix crítico: `auth.users` con tokens NULL rompía GoTrue (`Scan error ... confirmation_token`) → normalización a `''` en BD + fin del seed | Backend | 2026-10-28 |
| T-010 | Edge Function `issue-qr` desplegada: QR firmado HMAC (TTL 60 s) + código temporal (8 díg., 5 min), rate limit 10/min/usuario; verificada (401 sin JWT, 200 con sesión) | Backend (frontend-ux) | 2026-10-28 |
| T-011 | Pantalla Acceso funcional: QR real + countdown 1 s + chip Activa/Caducada + código temporal con countdown; estados carga/error con role=alert; Playwright 375 px claro/oscuro | Frontend (frontend-ux) | 2026-10-28 |
| T-029 | Pass UI/UX con `/ui-ux-pro-max` + Playwright: Inicio con saludo+turno de hoy (skeleton/empty/error), Login con marca+autofoco+role=alert, favicon; verificación 375 px claro/oscuro | Frontend (frontend-ux) | 2026-10-28 |
| T-030 | Pass UI/UX estilo Waylet (sobre `index.html` de palo623): cabecera Inicio con degradado+llama+avatar+reloj en vivo+chip de estado, tarjeta de turno superpuesta con barra de progreso (soporta turno de noche), Login con cabecera de marca, esquinas de visor en QR; 10 tests verdes, Playwright 375 px claro/oscuro | Frontend (frontend-ux) | 2026-10-28 |
| T-031 | ~~Onboarding first-login (bienvenida + tema) + seed rico de calendario~~ | Frontend | Hecho. Diálogo 3 pasos (bienvenida, cómo funciona, tema) 1 vez/dispositivo (localStorage); migración 20261028000007 con festivos 2026, 9 vacaciones y 5 eventos; turnos generados -180..+365 días (2026-10-28, frontend-ux) |
| T-016 | ~~Vacaciones: solicitud + aprobación líder + notificación~~ | Backend+Frontend | 2026-10-29 — ✅ Solicitud con cálculo de días, anulación propia, panel «Pendientes de tu equipo» con aprobar/rechazar (RLS+trigger validan en servidor), notificación automática al decidir. Verificado Playwright: empleado→líder→notificación (2026-10-29, frontend-ux) |
| T-017 | ~~Centro de notificaciones + badge + Realtime~~ | Frontend+Backend | 2026-10-29 — ✅ Lista agrupada Hoy/Ayer, no leídas destacadas, marcar individual/todas, badge en BottomNav, realtime via postgres_changes (migración 20261029000001). Verificado con INSERT remoto sin recargar (2026-10-29, frontend-ux) |
