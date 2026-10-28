# Preguntas resueltas — decisiones del PO (fase inicial)

> Recogidas el 2026-10-28 antes de escribir código. Fuente de verdad del alcance.

| # | Ambigüedad | Decisión |
|---|---|---|
| Q1 | Alcance del control de acceso | **Solo emisión de credenciales en el MVP.** El PO advierte: *"posiblemente más adelante hagamos que ese mismo QR/NFC se pueda escanear desde los tornos y lectores de Repsol"* → ver [[adrs/ADR-003-credenciales-validables]] |
| Q2 | Alta de usuarios | **Alta por administrador** (formulario o CSV + invitación por email). Sin auto-registro ni SSO |
| Q3 | Alcance de la primera entrega | **MVP completo funcional** (todas las funcionalidades de [[01-Analisis-funcional]]), secuenciado en fases técnicas de [[05-Roadmap]] |
| Q4 | Notificaciones push | **Web Push con VAPID** (Edge Function + service worker); en APK, canales nativos vía Capacitor |
| Q5 | Despliegue web | **Vercel** |
| Q6 | Idioma | **Solo español**, con código preparado para i18n futuro (`profiles.locale`) |
| Q7 | Volumen | **Gran escala: >5.000 empleados** → paginación, índices y métricas pre-agregadas desde el diseño |
| Q8 | Modelo de turnos | **Patrones rotativos configurables** asignados a equipos (ciclo + offset), con generación de turnos por fecha |
| Q9 | NFC en la app | **Solo QR + código temporal en el MVP**; NFC queda para fase futura (campo `nfc_uid` ya previsto) |
| Q10 | Festivos | **Nacional + festivos regionales por centro** (ámbito `nacional`/`comunidad`/`centro`) |

## Identidad visual (investigación propia, no del PO)
- Repsol renovó su marca en **junio de 2025** (degradado naranja→magenta, tipografía en minúscula, marfil nuevo). Decisiones y justificación en [[04-Diseno-UX-UI]].
