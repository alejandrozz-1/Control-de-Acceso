# Roadmap de desarrollo

> Duración orientativa: ~10-12 semanas con agentes coordinados (arquitectura, backend, frontend, QA, DevOps en paralelo por fases).

## Fase 0 — Fundamentos (semana 1)
- Push inicial del repo: `main` + `develop`, estructura de carpetas, bóveda Obsidian, CI básica (lint + typecheck).
- Proyecto Supabase: migraciones 0001-0007, seed, RLS.
- Design tokens MUI + tema claro/oscuro + shell de navegación (bottom nav).
- **Salida:** app que arranca, login, navega 5 destinos; BD con RLS; docs base.
- **Agentes:** Arquitectura + DevOps + Backend + Frontend.

## Fase 1 — Identidad, roles y cuenta (semana 2)
- Auth completo (login, invitación por email, alta admin por formulario/CSV).
- RBAC visible: guardas de ruta por rol, alta de centros/equipos/miembros.
- Perfil + preferencias de notificación.
- **Salida:** US-01 operativa.

## Fase 2 — Credenciales de acceso (semana 3-4)
- Generación QR firmado + código temporal (Edge Function, TTL, intentos).
- Revocación individual/masiva con efecto inmediato.
- Auditoría de emisión/revocación.
- **Salida:** US-02, US-03. *(Riesgo: validar formato del QR para futura lectura por tornos → ADR-003.)*

## Fase 3 — Calendario, turnos y festivos (semana 4-6)
- Patrones rotativos + asignación + generación de `shift_entries`.
- Festivos nacional/comunidad/centro; eventos corporativos.
- Vista calendario del empleado.
- **Salida:** US-04, US-08.

## Fase 4 — Vacaciones y notificaciones (semana 6-7)
- Solicitudes + flujo de aprobación (líder/admin).
- Centro de notificaciones + Web Push VAPID (PWA) + avisos de cambio de turno.
- **Salida:** US-05, US-06, US-09.

## Fase 5 — Vista responsable: registros y métricas (semana 7-9)
- Registros de acceso, horarios entrada/salida, filtros y CSV.
- KPIs de asistencia (MV pre-agregadas), dashboards.
- Comunicaciones internas dirigidas.
- **Salida:** US-07, US-10, US-11.

## Fase 6 — PWA, Capacitor y endurecimiento (semana 9-11)
- Manifest, service worker, instalabilidad (ver [[11-Estrategia-PWA]]).
- Empaquetado Android con Capacitor, notificaciones locales/push nativas ([[12-Estrategia-Capacitor]]).
- Seguridad: CSP, rate limiting, revisión OWASP, advisors sin avisos.
- QA e2e completo, Lighthouse AA, a11y.
- **Salida:** APK beta + PWA en producción (Vercel).

## Fase 7 — Release (semana 11-12)
- `release/1.0.0` → QA final → tag → `main` → despliegue ([[13-Estrategia-despliegue]]).
- Post-release: MFA, NFC, integración tornos (épica futura).

## Hitos
| Hito | Al final de |
|---|---|
| M1 — Base sólida (app + BD + RLS) | Fase 0-1 |
| M2 — Credenciales operativas | Fase 2 |
| M3 — Calendario completo | Fase 3-4 |
| M4 — Visión responsable | Fase 5 |
| M5 — Beta instalable | Fase 6 |
| M6 — Producción 1.0 | Fase 7 |

## Dependencias críticas
- **Bloqueo B-01**: permisos MCP Supabase → bloquea Fase 0-BD.
- Assets de marca (brandcenter) → bloquea pulido visual final (Fase 6).
- Cuenta Vercel + GitHub Actions secretos → bloquea despliegue (Fase 0-DevOps).
