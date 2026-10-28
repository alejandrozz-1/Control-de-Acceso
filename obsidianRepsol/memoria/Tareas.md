# Tareas

> Añade filas; no borres las finalizadas (append-only). Formato: `ID | Tarea | Agente | Estado | Notas`.

## ⬜ Pendiente

| ID | Tarea | Agente | Notas |
|---|---|---|---|
| T-007 | Tipos generados de BD (`database.types.ts`) en `apps/web/src/services/` | Frontend/Backend | Cliente supabase.ts ya creado; tipos pendientes (requiere `supabase gen types` con token) |
| T-008 | Auth: login, guardas por rol, invitación por email, alta admin/CSV | Backend+Frontend | US-01 |
| T-009 | Centro/equipos CRUD (admin) | Backend+Frontend | |
| T-010 | Credenciales: Edge Function QR firmado + código temporal | Backend | US-02, ADR-003 |
| T-011 | Pantalla Acceso (QR fullscreen, temporizador, estado) | Frontend | US-02 (mockup listo) |
| T-012 | Revocación individual/masiva + auditoría | Backend+Frontend | US-03 |
| T-013 | Limpiar/regenerar `shift_entries` al editar asignaciones (limpieza de obsoletos) + patrones UI | Backend | Gen. automática ya funciona (trigger) |
| T-014 | Festivos + eventos: UI admin | Backend+Frontend | Tablas y RLS listos |
| T-015 | Vista Calendario (mes, leyenda, turnos, festivos) | Frontend | US-04 |
| T-016 | Vacaciones: solicitud + aprobación líder + notificación | Backend+Frontend | US-05, US-06 (trigger de aprobación listo) |
| T-017 | Centro de notificaciones + badge + Realtime | Frontend+Backend | US-09 |
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

| ID | Tarea | Agente | Desde |
|---|---|---|---|
| — | Sin tareas en curso | | |

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
