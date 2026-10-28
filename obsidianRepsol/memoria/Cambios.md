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

### Plantilla
```
| YYYY-MM-DD | <agente> | <qué> | <archivo/PR/commit> | T-0xx |
```
