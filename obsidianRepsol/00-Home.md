# Control de Acceso Repsol — Bóveda del Proyecto

> **Fuente de verdad.** Toda documentación vive aquí y se sincroniza con Git. Ningún agente puede eliminar información histórica; solo añadir o editar con registro de cambios.

## Índice de entregables

### Fase inicial (completada)
- [[01-Analisis-funcional]] — Requisitos y alcance MVP
- [[02-Arquitectura]] — Arquitectura del sistema + ADRs
- [[03-Base-de-datos]] — Modelo de datos, índices, RLS, migraciones, seed
- [[04-Diseno-UX-UI]] — Identidad Repsol verificada, tokens, WCAG
- [[05-Roadmap]] — Fases y hitos
- [[06-Estructura-de-carpetas]] — Estructura del repo
- [[07-Git-estrategia]] — Ramas, merge y revisión entre agentes
- [[08-Memoria-compartida]] — Protocolo de la bóveda para agentes
- [[09-Plan-de-testing]]
- [[10-Riesgos]]
- [[11-Estrategia-PWA]]
- [[12-Estrategia-Capacitor]]
- [[13-Estrategia-despliegue]]

### ADRs
- [[adrs/ADR-001-stack-frontend|ADR-001 Stack frontend]]
- [[adrs/ADR-002-supabase-backend|ADR-002 Supabase como backend]]
- [[adrs/ADR-003-credenciales-validables|ADR-003 Credenciales QR validables hoy y por tornos mañana]]
- [[adrs/ADR-004-estado-y-datos|ADR-004 Estado cliente: Zustand + TanStack Query]]

### Memoria compartida (viva)
- [[memoria/Estado-global]] — Riesgos, bloqueos, dependencias
- [[memoria/Tareas]] — Pendiente / En curso / Finalizada
- [[memoria/Cambios]] — Registro de cambios (append-only)
- [[memoria/Comunicaciones]] — Decisiones, propuestas, acuerdos entre agentes
- [[memoria/Preguntas-resueltas]] — Decisiones del PO de la fase inicial
- `memoria/Handovers/` — Un handover por cierre de tarea

## Estado global (resumen)
| Área | Estado |
|---|---|
| Fase inicial (análisis) | ✅ Completada |
| Fase 0 — fundamentos (BD, scaffold, CI) | ✅ Completada (2026-10-28) |
| Desarrollo Fase 1 (auth/roles) | ⬜ Siguiente |
| Repo GitHub | ✅ `main` + `develop` publicados |
| Supabase | ✅ Esquema + RLS + seed aplicados (0 ERROR advisors) |
| PWA / Capacitor | ⬜ Fase 6 |

## Protocolo rápido para agentes (antes de tocar nada)
1. `git pull` de tu rama.
2. Lee [[memoria/Estado-global]], ADRs, [[memoria/Tareas]], [[memoria/Comunicaciones]], handovers y `git log` reciente (qué están haciendo AHORA los demás).
3. **Decide qué vas a hacer** y escríbelo en la columna **Plan** de tu fila "🔄 En curso" en [[memoria/Tareas]] (agente, fecha, qué tocas, qué NO tocas).
4. `git commit -m "docs(obsidian): <agente> toma tarea <id> — <plan>" && git push && git push origin develop:main` — **solo Obsidian, ANTES de tocar código**. Así el resto de agentes ve en el remoto quién ha tomado qué y con qué alcance.
5. Trabaja.
6. Al terminar: actualiza docs, decisiones, riesgos, pendientes, handover; commit + push.

Detalle completo en [[08-Memoria-compartida]].
