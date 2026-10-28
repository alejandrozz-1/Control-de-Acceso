---
adr: 002
estado: aceptado
fecha: 2026-10-28
agentes: [arquitectura, backend]
---

# ADR-002 — Supabase como backend completo

## Contexto
El proyecto define Supabase como backend principal (Auth, PostgreSQL, Storage, Edge Functions) y pide escalabilidad, seguridad RBAC y auditoría para >5.000 empleados.

## Decisión
No escribir API propia. Toda comunicación pasa por Supabase con **autorización en la base de datos (RLS)**:

- **Auth**: alta por administrador (decisión del PO); invitación por email; MFA solo "preparado" (`profiles.mfa_enabled`).
- **PostgREST**: CRUD del cliente con tipos generados (`database.types.ts`).
- **RLS en el **95% de las reglas**: cada consulta se filtra por `auth.uid()`, rol global y liderazgo de equipo (ver [[03-Base-de-datos]] §7). Ventaja: inescapable, aunque el cliente esté comprometido.
- **Edge Functions** solo para lógica sensible/de servidor:
  1. emisión/validación de códigos temporales (secretos, TTL, intentos),
  2. Web Push VAPID (clave privada nunca en el cliente),
  3. jobs (preagregación de métricas, purga de temporales caducados).
- **Storage**: avatar de perfil y CSV de importación masiva.
- **Realtime**: canales de `notifications` para badge en vivo.

## Consecuencias
- Se renuncia a lógica de negocio en servidor propia (menos código, pero menos flexibilidad para reglas complejas → si surgen, van a Edge Functions, no a la app).
- **CSRF no aplica**: la autenticación es por `Authorization: Bearer <JWT>`, no cookies cross-site; se mantiene CSP estricta contra inyección de scripts.
- Rate limiting: límites de Supabase por defecto + límites adicionales en Edge Functions; documentarlos en el test de seguridad.
- Coste/escala: revisar en Fase 5 (R-10).

## Alternativas descartadas
- NestJS/Express propio: más superficie a mantener, autorización duplicada en app y API.
- Solo Edge Functions: perderíamos RLS y haríamos un API a mano.
