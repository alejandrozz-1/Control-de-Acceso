# Estado global del proyecto

> Última actualización: 2026-10-28 (sesión 2) — por: coordinador

## Salud general
🟡 Fase 0 de desarrollo completada (BD + scaffold + CI). Pendiente de: secretos GitHub, tipos de BD y arranque de Fase 1 (auth).

## Riesgos activos
Definición completa en [[10-Riesgos]].

| ID | Riesgo | Estado |
|---|---|---|
| R-01 | MCP Supabase sin permisos | 🟢 Mitigado: se usa token `SUPABASE_ACCESS_TOKEN` + `scripts/apply-migrations.mjs` (Management API). El MCP sigue sin permisos (no bloquea) |
| R-02 | Formato de QR esperado por tornos Repsol desconocido | 🟡 Verificar en Fase 2 (ADR-003) |
| R-03 | Escala >5.000 | 🟡 Índices + triggers listos; MV de métricas en Fase 5 |
| R-06 | Assets/tipografía de marca sin confirmar | 🟡 Pendiente cliente |
| R-08 | Conflictos entre agentes | ⚪ No aplica todavía (un solo agente activo) |
| R-10 | Free tier Supabase | ⚪ Vigilar en Fase 5 |
| R-11 | Clave privada VAPID y token Supabase deben vivir solo en secretos (Vercel/GitHub), nunca en el repo | 🟡 Acción del usuario (ver C-005) |

## Bloqueos

| ID | Bloqueo | Estado |
|---|---|---|
| B-01 | ~~MCP Supabase sin permisos~~ | ✅ **Resuelto 2026-10-28**: token de proyecto facilitado por el usuario; migraciones vía Management API (`scripts/apply-migrations.mjs`), registradas en `supabase_migrations` para compatibilidad con la CLI |
| B-02 | Repo GitHub vacío / secretos | 🟡 **Parcial**: repo con `main`+`develop` publicados. Pendiente: secret `SUPABASE_ACCESS_TOKEN` en GitHub Actions (T-027) y variables de entorno en Vercel (usuario) |

## Dependencias
- Cliente → assets de marca, contrato de QR con tornos, keystore Android, **configurar en Vercel**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (ver C-005).
- QA → tests e2e requieren Fase 1 (auth) operativa.

## Estado de la infraestructura (2026-10-28)

| Componente | Estado |
|---|---|
| Supabase `bipcvxetgypugwnbhmwm` (eu-central-1) | ✅ 16 tablas, RLS 16/16, advisors **0 ERROR** / 6 WARN aceptados, seed aplicado |
| Migraciones | ✅ 8 archivos `2026102800000X_*.sql`, idempotentes, vía `node scripts/apply-migrations.mjs` |
| App web (apps/web) | ✅ `lint+typecheck+test+build` en verde; build 134 kB gzip |
| CI | ✅ `ci.yml` en develop/main (advisors con secret, si no → skip) |
| PWA / Capacitor | ⬜ Fases 6 |
