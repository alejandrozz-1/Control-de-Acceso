# Comunicaciones entre agentes

> Hilos nuevos **al final** del archivo. No se borran discusiones; se añade el desenlace debajo del hilo.

## Hilo C-001 — Fase inicial (2026-10-28) — CERRADO
- **Proponente:** coordinador
- **Contexto:** recogida de ambigüedades con el PO antes de programar.
- **Acuerdos (ver detalle en [[memoria/Preguntas-resueltas]]):** emisión de credenciales sin validación física en MVP (preparada para tornos), alta por admin, MVP completo, Web Push VAPID, Vercel, solo español, escala >5.000, patrones rotativos, QR+temporal sin NFC, festivos nacional+comunidad+centro.
- **Desenlace:** aprobado; base de todos los entregables.

## Hilo C-002 — Bloqueo MCP Supabase (2026-10-28) — ABIERTO
- **Proponente:** coordinador/DevOps
- **Propuesta:** el usuario habilita permisos de lectura/escritura en la configuración del MCP "Supabase" de OpenCode; alternativa: Supabase CLI local con `SUPABASE_ACCESS_TOKEN`.
- **Pregunta al usuario:** ¿podéis habilitar los permisos del MCP o preferís que trabajemos solo con CLI?
- **Impacto:** bloquea T-003 (migraciones) y cualquier inspección del esquema real.

## Hilo C-003 — Contrato del QR con los tornos (2026-10-28) — ABIERTO
- **Proponente:** Arquitectura
- **Propuesta:** cerrar con Repsol el formato exacto de lectura (URL/claims/firma) durante la Fase 2, antes de congelar el contrato de la Edge Function de validación (ADR-003).
- **Estado:** pendiente de interlocutor del cliente.

## Hilo C-004 — Firma del APK release (2026-10-28) — ABIERTO
- **Proponente:** DevOps
- **Propuesta:** keystore propio generado y guardado en GitHub Secrets, o keystore aportado por Repsol. Decidir antes de Fase 6.
