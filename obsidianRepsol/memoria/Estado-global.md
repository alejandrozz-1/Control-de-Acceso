# Estado global del proyecto

> Última actualización: 2026-10-28 — por: coordinador (fase inicial)

## Salud general
🟡 Fase inicial completada; desarrollo bloqueado por B-01/B-02.

## Riesgos activos
Definición completa en [[10-Riesgos]].

| ID | Riesgo | Estado |
|---|---|---|
| R-01 | MCP Supabase sin permisos | 🔴 Activo (B-01) |
| R-02 | Formato de QR esperado por tornos Repsol desconocido | 🟡 Mitigado por ADR-003, verificar en Fase 2 |
| R-03 | Escala >5.000 | 🟡 Mitigado (índices + MV) |
| R-06 | Assets/tipografía de marca sin confirmar | 🟡 Pendiente cliente |
| R-10 | Free tier Supabase | ⚪ Vigilar en Fase 5 |

## Bloqueos
| ID | Bloqueo | Quién desbloquea | Desde |
|---|---|---|---|
| B-01 | MCP Supabase: `list_tables`/`list_migrations` → "You do not have permission to perform this action" | Usuario (habilitar permisos en la config del MCP) o Supabase CLI con token local | 2026-10-28 |
| B-02 | Repo GitHub **vacío** (sin commits); sin cuenta Vercel ni secretos (VAPID, SUPABASE_ACCESS_TOKEN) | DevOps + usuario | 2026-10-28 |

## Dependencias
- Cliente → assets de marca, decisión de tornos, dominio de producción, keystore Android.
- DevOps → CI base antes de que otros agentes commiteen (R-05).

## Decisiones de estado
- Fuente de verdad: esta bóveda ([[08-Memoria-compartida]]).
- Alcance: MVP completo, una sola entrega por fases ([[05-Roadmap]]).
