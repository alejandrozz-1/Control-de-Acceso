---
adr: 004
estado: aceptado
fecha: 2026-10-28
agentes: [arquitectura, frontend]
---

# ADR-004 — Estado cliente: TanStack Query + Zustand

## Contexto
El proyecto permite "Zustand o Redux Toolkit". Hace falta una regla clara de qué estado vive dónde, sobre todo con >5.000 empleados y muchas listas.

## Decisión
**Fuente de verdad = servidor.** Reglas:

| Tipo de estado | Herramienta | Ejemplos |
|---|---|---|
| Datos remotos (BD) | **TanStack Query** | perfil, calendario, turnos, vacaciones, registros, métricas, notificaciones |
| Sesión/rol/UI efímero | **Zustand** | usuario actual normalizado, tema (claro/oscuro), estado de bottom nav, flag "mostrar aviso instalación" |
| Formularios | Estado local + react-hook-form | altas, solicitudes |
| URL | React Router | filtros de registros, mes del calendario |

- **Prohibido** duplicar en Zustand datos que ya están en TanStack Query (regla revisable en PR).
- Invalidación en tiempo real: canal Realtime de Supabase → `queryClient.invalidateQueries`.
- Persistencia: solo `theme` y preferencias efímeras en `localStorage` (lo persistente del perfil está en BD).

## Consecuencias
- Menos bugs de sincronización y menos código que Redux con slices/normalización.
- Si aparece estado complejo cross-feature (p.ej. flujo de aprobaciones multi-paso con cola offline), se reevalúa en ADR nuevo.

## Alternativas descartadas
- Redux Toolkit: boilerplate de actions/reducers para datos que TanStack Query ya cachea.
- Zustand para todo: replicaría caché, reintentos y paginación que ya hace TanStack Query.
