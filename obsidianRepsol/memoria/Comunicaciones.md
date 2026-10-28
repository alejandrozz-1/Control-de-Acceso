# Comunicaciones entre agentes

> Hilos nuevos **al final** del archivo. No se borran discusiones; se añade el desenlace debajo del hilo.

## Hilo C-001 — Fase inicial (2026-10-28) — CERRADO
- **Proponente:** coordinador
- **Contexto:** recogida de ambigüedades con el PO antes de programar.
- **Acuerdos (ver detalle en [[memoria/Preguntas-resueltas]]):** emisión de credenciales sin validación física en MVP (preparada para tornos), alta por admin, MVP completo, Web Push VAPID, Vercel, solo español, escala >5.000, patrones rotativos, QR+temporal sin NFC, festivos nacional+comunidad+centro.
- **Desenlace:** aprobado; base de todos los entregables.

## Hilo C-002 — Bloqueo MCP Supabase (2026-10-28) — CERRADO
- **Proponente:** coordinador/DevOps
- **Propuesta:** el usuario habilita permisos de lectura/escritura en el MCP o se usa la CLI.
- **Desenlace (2026-10-28, sesión 2):** el usuario facilitó **token de acceso a Supabase** (`SUPABASE_ACCESS_TOKEN`, proyecto `bipcvxetgypugwnbhmwm`). Las migraciones se aplican con `node scripts/apply-migrations.mjs` (Management API `database/query`) y quedan registradas en `supabase_migrations.schema_migrations` para que `supabase db push` futuro las reconozca. El MCP sigue sin permisos (no bloquea).

## Hilo C-003 — Contrato del QR con los tornos (2026-10-28) — ABIERTO
- **Proponente:** Arquitectura
- **Propuesta:** cerrar con Repsol el formato exacto de lectura (URL/claims/firma) durante la Fase 2, antes de congelar el contrato de la Edge Function de validación (ADR-003).
- **Estado:** pendiente de interlocutor del cliente.

## Hilo C-004 — Firma del APK release (2026-10-28) — ABIERTO
- **Proponente:** DevOps
- **Propuesta:** keystore propio generado y guardado en GitHub Secrets, o keystore aportado por Repsol. Decidir antes de Fase 6.

## Hilo C-005 — Decisiones del usuario sobre infraestructura (2026-10-28) — CERRADO
- **Proponente:** usuario (PO técnico)
- **Decisiones:**
  1. **Token Supabase:** `SUPABASE_ACCESS_TOKEN` facilitado → usado en `.env.local` (gitignored) y `scripts/apply-migrations.mjs`. *Nunca* commitear.
  2. **Vercel:** lo hospeda y configura **el usuario**. Variables a dar de alta en Vercel:
     - `VITE_SUPABASE_URL=https://bipcvxetgypugwnbhmwm.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` (ver `.env.local`)
     - `VITE_VAPID_PUBLIC_KEY=BM2VYfWzUq0FudbKoVhZc5QosQ2a1rknTU36k8ZDG5_bdlSXU9iYO460qvPiwDH8kW5CyDhxDbVTT80GJr2aXyU`
     - `VAPID_PRIVATE_KEY` (ver `.env.local` — **secreto**, solo servidor/Edge)
  3. **Par VAPID:** generado por el agente (`npx web-push generate-vapid-keys`) → `.env.local` (privada) y `.env.example` (placeholders). Rotación: regenerar y actualizar ambos entornos.
  4. **Resto:** aprobado el trabajo de Fase 0 ("por lo demás todo perfecto, continúa").
- **Desenlace:** ejecutado; ver [[memoria/Cambios]] sesión 2.
