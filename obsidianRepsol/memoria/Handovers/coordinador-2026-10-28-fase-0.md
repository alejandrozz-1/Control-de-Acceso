---
agente: coordinador
fecha: 2026-10-28
tarea: T-001..T-006
estado: done
---

# Handover: Fase 0 — fundamentos (BD + scaffold + CI)

## Hecho
- **Repo**: `main` + `develop` publicados; README → Obsidian; `.gitignore`, `.env.example`, CODEOWNERS, plantilla de PR, CI (`ci.yml`).
- **Supabase** (`bipcvxetgypugwnbhmwm`): 8 migraciones idempotentes aplicadas vía `node scripts/apply-migrations.mjs` (requiere `SUPABASE_ACCESS_TOKEN`). 16 tablas, **RLS 16/16**, triggers (turnos→`shift_entries`, auditoría append-only, aprobación de vacaciones con notificación, revocación→notificación), helpers de rol. Advisors: **0 ERROR / 6 WARN aceptados**.
- **Seed**: aplicado y verificado — 10 usuarios `@test.local` (contraseña `Password123!`), 3.564 turnos autogenerados, 60 logs de acceso.
- **App** (`apps/web`): Vite + React 19 + MUI (tokens Repsol, claro/oscuro, Inter), router con 5 destinos + BottomNavigation mobile-first, cliente Supabase, página Acceso con mockup QR. `lint+typecheck+test+build` en verde (build 134 kB gzip, 2 smoke tests).
- **VAPID**: par generado → privada en `.env.local`, pública `BM2VYfWz...GJr2aXyU` (documentada en Comunicaciones C-005).

## Cómo probarlo
```powershell
npm ci; npm run lint; npm run typecheck; npm run test; npm run build
npm run dev   # http://localhost:5173 — 5 destinos navegables
node scripts/apply-migrations.mjs   # idempotente (requiere token en env)
```
Login real aún no existe (Fase 1). Usuarios seed: `admin@test.local` / `Password123!`.

## Siguiente paso sugerido
1. **Fase 1 (T-008/T-009)**: login con Supabase Auth, guardas de rol en el router, alta de usuarios por admin (invitación email), CRUD centros/equipos.
2. Tipos de BD (T-007) y secret `SUPABASE_ACCESS_TOKEN` en GitHub (T-027).
3. Variables de Vercel dadas de alta por el usuario (C-005).

## Riesgos/pending
- `fn_generate_shift_entries` solo materializa hasta +365 días (shortcut comentado) y no limpia entradas obsoletas al editar asignaciones → T-013.
- Rate limiting de códigos temporales pendiente de la Edge Function (comentario en `fn_check_temporal`).
- Contrato QR con tornos (C-003) y keystore APK (C-004) siguen abiertos.
