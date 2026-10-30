# Estado global del proyecto

> Última actualización: 2026-10-30 — por: agente de sesión (antes: 2026-10-29 frontend-ux, 2026-10-28 sesión 2, coordinador)

## Salud general
🟡 Fases 0-4 en marcha: auth, Acceso (QR validado end-to-end contra la Edge Function `validate-access`), Calendario con festivos por comunidad, Vacaciones y Notificaciones. 2026-10-30: revisión completa con Playwright + fixes de bugs reales (BrowserRouter, permisos admin, festivos, fechas, layout). Pendiente: alta CSV, CRUD centros/equipos, push, PWA, APK compilado.

## Riesgos activos
Definición completa en [[10-Riesgos]].

| ID | Riesgo | Estado |
|---|---|---|
| R-01 | MCP Supabase sin permisos | 🟢 Mitigado: se usa token `SUPABASE_ACCESS_TOKEN` + `scripts/apply-migrations.mjs` (Management API). El MCP sigue sin permisos (no bloquea) |
| R-02 | Formato de QR esperado por tornos Repsol desconocido | 🟡 Contrato servidor ya definido (POST `validate-access` con `x-device-key`, payload HMAC QR o código temporal); falta confirmar con el integrador el formato exacto que espera el torno (ADR-003) |
| R-03 | Escala >5.000 | 🟡 Índices + triggers listos; MV de métricas en Fase 5 |
| R-06 | Assets/tipografía de marca sin confirmar | 🟡 Pendiente cliente |
| R-08 | Conflictos entre agentes | 🟡 Activo: trabajo paralelo real (palo623 + frontend-ux). Mitigación: protocolo de toma de tarea con commit aislado `docs(obsidian): <agente> toma tarea <id>` antes de tocar código (ver [[08-Memoria-compartida]]) |
| R-10 | Free tier Supabase | ⚪ Vigilar en Fase 5 |
| R-11 | Clave privada VAPID y token Supabase deben vivir solo en secretos (Vercel/GitHub), nunca en el repo | 🟡 Acción del usuario (ver C-005) |
| R-12 | `password_hibp_enabled` (leaked password protection) **no activable: plan Free** (Management API → 402 "Pro Plans and up"). Mitigación: `password_min_length=6` por defecto + validación de fuerza en el frontend al crear/invitar usuarios; reevaluar al subir de plan | 🟡 Aceptado (plan Free) |
| R-13 | Email rate limit plan Free = **2 envíos/hora** (`rate_limit_email_sent`) y no se puede subir sin SMTP custom → invitaciones de admin limitadas. Mitigación: mensaje claro en UI (`limite_invitaciones_alcanzado`); subir a SMTP custom (decisión cliente) | 🟡 Aceptado (plan Free) |
| R-14 | Build 230 kB gzip (subió con MUI Table/Dialog + TanStack Query). Mitigación: lazy-load de rutas admin en Fase 2 | 🟡 Vigilar |

## Bloqueos

| ID | Bloqueo | Estado |
|---|---|---|
| B-01 | ~~MCP Supabase sin permisos~~ | ✅ **Resuelto 2026-10-28**: token de proyecto facilitado por el usuario; migraciones vía Management API (`scripts/apply-migrations.mjs`), registradas en `supabase_migrations` para compatibilidad con la CLI |
| B-02 | Repo GitHub vacío / secretos | 🟡 **Parcial**: repo con `main`+`develop` publicados. Pendiente: secret `SUPABASE_ACCESS_TOKEN` en GitHub Actions (T-027) y variables de entorno en Vercel (usuario) |
| B-03 | Máquina de desarrollo sin Docker Engine (WSL2 ausente) ni JDK/Android SDK | 🟡 Build de imagen Docker y APK delegado a la VM de Azure del usuario (entra en remoto desde Visual Studio); artefactos listos en repo |

## Dependencias
- Cliente → assets de marca, contrato de QR con tornos, keystore Android, **configurar en Vercel**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (ver C-005).
- Integrador de tornos → clave de dispositivo `TURNSTILE_API_KEY` (en `.env.local` y como secreto en Supabase) + contrato: `POST {project}/functions/v1/validate-access`, header `x-device-key`, body `{"payload": "<qr>"}` o `{"code": "<temporal>"}`.
- QA → tests e2e requieren Fase 1 (auth) operativa.

## Estado de la infraestructura (2026-10-30)

| Componente | Estado |
|---|---|
| Supabase `bipcvxetgypugwnbhmwm` (eu-central-1) | ✅ 16 tablas, RLS 16/16, advisors **0 ERROR** / 6 WARN aceptados + 1 WARN plan free (R-12), seed aplicado |
| Migraciones | ✅ 11 versiones registradas. `20261030000001` (fix RLS: recursión `team_members`, INSERT de credenciales revokeado, `fn_expire/purge_credentials`) aplicada 2026-10-30. El seed de calendario se renombró `20261028000007`→`20261030000002` (colisión de timestamp con `audit_rls`) y queda registrado como aplicado (dato ya verificado: 14 festivos, 9 vacaciones, 5 eventos) |
| Edge Functions | ✅ `invite-user`, `issue-qr` (limpia credenciales caducadas en cada emisión) y `validate-access` (torno: HMAC QR → entrada/salida + código temporal de un solo uso, protegida por `x-device-key`) desplegadas y probadas end-to-end (incl. rechazos: firma inválida, caducada, clave errónea) |
| Credenciales | ✅ Limpieza 2026-10-30: 115 vencidas marcadas `caducada` (antes estaban `activa`); purga automática vía `fn_purge_credentials` |
| Auth (GoTrue) | ✅ Login verificado con usuarios seed. **Lección**: insertar usuarios directamente en `auth.users` exige normalizar columnas token a `''` (NULL → `Scan error` en GoTrue) — ya en el seed |
| App web (apps/web) | ✅ `lint+typecheck+test+build` en verde (40 tests); build ~227 kB gzip (R-14). 2026-10-30: `BrowserRouter` (URLs reales + botón atrás), `/admin/*` solo admin, festivos filtrados por comunidad del centro, fixes de fechas/layout/copy |
| CI | ✅ `ci.yml` en develop/main (advisors con secret, si no → skip) |
| Docker | 🟡 `apps/web/Dockerfile` (Node build → nginx con fallback SPA) + `docker-compose.yml` listos y validados; **build pendiente en la VM de Azure** (la máquina dev no tiene Docker Engine; ver [[13-Estrategia-despliegue]]) |
| PWA / Capacitor | 🟡 Capacitor 8: `capacitor.config.ts` + plataformas `android/` e `ios/` generadas y con `npm run cap:sync -w control-acceso-web` verde. Pendiente: compilar APK (JDK 17 + Android SDK) e iOS (macOS + Xcode); push/back button/PWA en Fase 6 |
