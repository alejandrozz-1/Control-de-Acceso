---
adr: 003
estado: aceptado
fecha: 2026-10-28
agentes: [arquitectura, backend, po]
---

# ADR-003 — Credenciales emitidas hoy, validables por tornos mañana

## Contexto
Decisión del PO (2026-10-28): *"por ahora solo emisión de credenciales, pero posiblemente más adelante hagamos que ese mismo QR/NFC se pueda escanear desde los tornos y lectores de Repsol, que lo tengáis en cuenta"*.

## Decisión
El MVP **solo emite** credenciales (QR + código temporal), pero se diseña para que **el mismo QR sea válido mañana por hardware de Repsol sin migraciones**:

1. **Payload del QR = `credential_id` (UUID) firmado** (HMAC corto con timestamp), nunca PII: ni nombre ni email. Cualquier lector (app o torno) puede enviarlo a la misma tabla.
2. **Validación servidor-side siempre**: al mostrar/compartir el QR se consulta `access_credentials.status`. Una credencial **revocada deja de servir al instante**, aunque el QR se muestre en pantalla. (Clave de seguridad: revocación masiva eficaz.)
3. **`access_logs` con `source ∈ {app, torno, manual}` y `method ∈ {qr, temporal, nfc, manual}`** → cuando los tornos se conecten, escriben en la misma tabla; los registros, horarios y métricas no cambian.
4. **`access_credentials.nfc_uid`** ya existe (nullable, unique) para la fase NFC.
5. **Endpoint futuro de validación**: la Edge Function de validación hoy la llama la app; mañana puede llamarla el torno con un service key/role dedicado (`source='torno'`), mismo contrato.

## Consecuencias
- El QR es un bearer token: por eso caducidad corta + revocación + hash en BD + rate limit en validación.
- Decisión pendiente con el cliente: **formato exacto que esperan los lectores de Repsol** (URL, claims, firma) → verificar en Fase 2 antes de cerrar el contrato (R-02).
- NFC queda fuera del MVP (decisión PO): la app no implementa HCE/lectura en esta entrega.

## Alternativas descartadas
- QR estático con datos del usuario: no revocable, expone PII, incompatible con tornos.
- Código solo en cliente (sin servidor): revocación imposible.
