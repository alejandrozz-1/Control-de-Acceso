# Tareas

> Añade filas; no borres las finalizadas (append-only). Formato: `ID | Tarea | Agente | Estado | Notas`.

## ⬜ Pendiente

| ID | Tarea | Agente | Notas |
|---|---|---|---|
| T-001 | Push inicial: `main` + `develop`, `.gitignore`, README → Obsidian, plantillas PR/CODEOWNERS | DevOps | Precondición de todo (R-05) |
| T-002 | Desbloquear MCP Supabase (B-01) o configurar CLI local | DevOps/usuario | Bloquea T-003 |
| T-003 | Migraciones 0001-0007 + RLS + `get_advisors` limpio | Backend | Diseño listo en [[03-Base-de-datos]] |
| T-004 | `seed.sql` determinista | Backend | Requisito de tests e2e |
| T-005 | Scaffold Vite + React 19 + MUI tema claro/oscuro + router + bottom nav | Frontend | Estructura en [[06-Estructura-de-carpetas]] |
| T-006 | CI `ci.yml` (lint, typecheck, test, build) | DevOps | |
| T-007 | Client `services/supabase.ts` + tipos generados | Frontend/Backend | |
| T-008 | Auth: login, guardas por rol, invitación por email, alta admin/CSV | Backend+Frontend | US-01 |
| T-009 | Centro/equipos CRUD (admin) | Backend+Frontend | US-11 parcial |
| T-010 | Credenciales: Edge Function QR firmado + código temporal | Backend | US-02, ADR-003 |
| T-011 | Pantalla Acceso (QR fullscreen, temporizador, estado) | Frontend | US-02 |
| T-012 | Revocación individual/masiva + auditoría | Backend+Frontend | US-03 |
| T-013 | Patrones rotativos + `fn_generate_shift_entries` | Backend | US-08 |
| T-014 | Festivos (nacional/comunidad/centro) + eventos corporativos | Backend+Frontend | |
| T-015 | Vista Calendario (mes, leyenda, turnos, festivos) | Frontend | US-04 |
| T-016 | Vacaciones: solicitud + aprobación líder + notificación | Backend+Frontend | US-05, US-06 |
| T-017 | Centro de notificaciones + badge + Realtime | Frontend+Backend | US-09 |
| T-018 | Web Push VAPID (Edge Function + SW) | DevOps+Frontend | US-09 |
| T-019 | Registros de acceso + horarios entrada/salida + CSV | Backend+Frontend | US-07 |
| T-020 | Métricas de asistencia (MV + dashboard) | Backend+Frontend | US-10 |
| T-021 | PWA: manifest + SW + instalabilidad | Frontend | [[11-Estrategia-PWA]] |
| T-022 | Capacitor: config + build APK debug en CI | Frontend+DevOps | [[12-Estrategia-Capacitor]] |
| T-023 | Seguridad: CSP, headers Vercel, checklist OWASP, rate limit | DevOps+QA | [[13-Estrategia-despliegue]] |
| T-024 | E2E Playwright flujos críticos + axe | QA | [[09-Plan-de-testing]] |
| T-025 | Despliegue preview/staging/producción Vercel | DevOps | |
| T-026 | Confirmar assets de marca (brandcenter) | UX/UI+cliente | R-06 |

## 🔄 En curso

| ID | Tarea | Agente | Desde |
|---|---|---|---|
| T-000 | Fase inicial: entregables de análisis y bóveda Obsidian | coordinador | 2026-10-28 |

## ✅ Finalizada

| ID | Tarea | Agente | Fecha |
|---|---|---|---|
| T-000 | Fase inicial: 13 entregables + 4 ADRs + memoria (ver [[memoria/Cambios]]) | coordinador | 2026-10-28 |
