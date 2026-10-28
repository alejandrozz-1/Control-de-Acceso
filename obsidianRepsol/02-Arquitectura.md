# Arquitectura del sistema

## 1. Vista general

```mermaid
flowchart LR
  subgraph Cliente
    PWA[PWA React 19 + Vite<br/>Mobile First / PWA instalable]
    APK[App Android vía Capacitor<br/>(mismo codebase)]
  end
  SUP[Supabase]
  PWA --> SUP
  APK --> SUP
  subgraph Supabase
    AUTH[Auth]
    API[PostgREST + RLS]
    EDGE[Edge Functions<br/>QR temporaless, Web Push VAPID, métricas]
    STOR[Storage]
    DB[(PostgreSQL)]
    RT[Realtime: notificaciones]
  end
  AUTH --> DB
  API --> DB
  EDGE --> DB
  PWA -. Web Push .-> EDGE
```

## 2. Decisiones (ADRs)

| ADR | Decisión | Motivo |
|---|---|---|
| [[adrs/ADR-001-stack-frontend\|ADR-001]] | React 19 + TS + Vite + MUI + React Router + TanStack Query + Zustand | Requisito del proyecto + ecosistema maduro, MUI cubre WCAG/dark mode |
| [[adrs/ADR-002-supabase-backend\|ADR-002]] | Supabase como backend completo (Auth, PostgREST, RLS, Edge, Storage) | Sin API propia que mantener; RLS = autorización en la BD; escala a >5.000 empleados |
| [[adrs/ADR-003-credenciales-validables\|ADR-003]] | Credenciales emitidas hoy con formato validable por tornos mañana | Decisión del PO: emisión en MVP, integración hardware futura sin migraciones |
| [[adrs/ADR-004-estado-y-datos\|ADR-004]] | TanStack Query para datos remotos, Zustand solo para estado de sesión/UI | Evita duplicar servidor en cliente |

## 3. Patrones aplicados

- **BFF innecesario**: el cliente habla con Supabase directamente; la lógica de negocio crítica (autorización, validación de credenciales, aprobaciones) vive en **RLS + Edge Functions**, nunca confiar en el cliente.
- **Edge Functions** solo para: generación/validación de credenciales temporales, envío de Web Push, generación de QR con firma, jobs (preagregación de métricas, caducidad de temporales).
- **Optimistic UI** en listas (TanStack Query) con invalidación por `Realtime` de Supabase para notificaciones.
- **Capas frontend**: `pages/` (rutas) → `features/` (módulo: componentes + hooks + store slice) → `components/ui/` (genéricos) → `services/` (cliente Supabase, tipos generados).

## 4. Seguridad (diseño)

- **RBAC** en `profiles.role` + `team_members.role`, aplicado por **RLS en cada tabla** (mínimo privilegio real, no solo UI).
- **OWASP Top 10**: salida parametrizada (PostgREST), XSS (React + CSP estricta), Broken Auth (Supabase Auth + rotación de tokens), CSRF (Supabase JWT en header, sin cookies cross-site), Rate Limiting (Edge Functions + límites de Supabase), IDOR (RLS: cada usuario solo ve lo suyo).
- **CSP**: `default-src 'self'; img-src 'self' data:; connect-src 'self' https://<proyecto>.supabase.co wss://<proyecto>.supabase.co; frame-ancestors 'none'` — se documenta en [[13-Estrategia-despliegue]] (headers Vercel).
- **JWT**: sesiones Supabase estándar; refresh token rotativo; sin tokens en `localStorage` fuera del mecanismo estándar de supabase-js.
- **Auditoría**: `audit_logs` escrito por triggers SQL (append-only, sin UPDATE/DELETE permitidos).
- **Cifrado**: en tránsito (TLS), en reposo (Supabase), credenciales guardadas **hasheadas** (no el QR en claro).
- **MFA**: tabla/flag preparado (`profiles.mfa_enabled`) sin activar.
- **CSRF**: no aplica (sin cookies de sesión); se documenta en ADR-002.

## 5. No funcionales

| Requisito | Objetivo |
|---|---|
| Escala | >5.000 empleados, listas paginadas, métricas pre-agregadas |
| Rendimiento PWA | LCP < 2.5 s en 4G, bundle inicial < 250 kB gzip (code-split por ruta) |
| Disponibilidad | 99% (SLA Supabase) |
| Accesibilidad | WCAG 2.1 AA |
| Compatibilidad | Chrome/Edge/Safari/ Firefox actuales + Android WebView 10+ |

## 6. Dependencias externas
- Supabase (proyecto "Control de acceso Repsol") — MCP conectado pero **sin permisos** (bloqueo activo, ver [[memoria/Estado-global]]).
- Vercel (despliegue), GitHub (repo y CI).
- Fuente de marca oficial: brandcenter.repsol.com (ver [[04-Diseno-UX-UI]]).
