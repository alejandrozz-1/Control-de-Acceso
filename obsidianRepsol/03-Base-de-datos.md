# Diseño de base de datos (PostgreSQL / Supabase)

> Fuente: requisitos de [[01-Analisis-funcional]]. Escala objetivo: >5.000 empleados.
> Migraciones con Supabase CLI (`supabase migrations new` → `supabase db push`). Seed en `supabase/seed.sql`.

## 1. Esquema de identidad

### `profiles` (1:1 con `auth.users`)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | = `auth.users.id` |
| email | text | |
| full_name | text | |
| employee_code | text UNIQUE | nº empleado corporativo |
| phone | text NULL | |
| role | user_role NOT NULL DEFAULT `'empleado'` | enum: `empleado`, `responsable`, `admin` |
| center_id | uuid FK → centers | centro base (define festivos) |
| locale | text DEFAULT `'es'` | preparado i18n |
| notification_prefs | jsonb | `{push:true, email:false, tipos:{turno:true,...}}` |
| mfa_enabled | boolean DEFAULT false | preparado |
| status | text DEFAULT `'activo'` | `activo`/`invitado`/`baja` |
| created_at / updated_at | timestamptz | |

- Trigger: `on auth.users insert → crear profile` (RLS `SELECT` propio; `INSERT` solo admin).

### Tablas de identidad/estructura
- **`centers`**: id, name, address, comunidad (c.Autónoma, p.ej. `madrid`), timezone, active.
- **`teams`**: id, name, center_id FK, active.
- **`team_members`**: team_id FK, user_id FK, role enum(`miembro`,`lider`), PK(compuesta), UNIQUE(user_id, team_id).

## 2. Turnos, calendario y ausencias

- **`shift_patterns`**: id, name, cycle_days int, definition jsonb
  `{"08:00-16:00":"M","16:00-00:00":"T","00:00-08:00":"N","libre":"L"}` + `sequence: ["M","M","M","M","T","T","N","N","L","L"]`, color, active.
- **`shift_assignments`**: id, team_id (o user_id NULL = individual), pattern_id FK, start_date, end_date NULL, rotation_offset int (día del ciclo en start_date).
- **`shift_entries`** (materializado): user_id, date, code, start_time, end_time. Se genera por función `fn_generate_shift_entries(from,to)` llamada al crear/modificar asignación y por job Edge mensual → **lecturas a >5.000 empleados son una query indexada**, no un cálculo.
- **`holidays`**: id, name, date, scope enum(`nacional`,`comunidad`,`centro`), comunidad NULL, center_id NULL, UNIQUE(name,date,scope,coalesce keys).
- **`vacation_requests`**: id, user_id, type enum(`vacacion`,`baja`,`permiso`), start_date, end_date, days numeric, status enum(`pendiente`,`aprobada`,`rechazada`,`anulada`), reason, reviewer_id NULL, decided_at NULL, created_at.
- **`corporate_events`**: id, title, description, starts_at, ends_at, all_day, center_id NULL (NULL = todos), team_id NULL.

## 3. Acceso (emisión hoy, validación futura)

- **`access_credentials`**:
  | Columna | Tipo | Notas |
  |---|---|---|
  | id | uuid PK | **payload del QR** = id (firmado, no es PII) |
  | user_id | uuid FK | |
  | kind | enum(`qr`,`temporal`,`nfc`) | |
  | token_hash | text NULL | solo temporales: hash del código mostrado |
  | expires_at | timestamptz NULL | temporales |
  | max_attempts | int DEFAULT 5 | temporales |
  | nfc_uid | text NULL UNIQUE | fase futura |
  | status | enum(`activa`,`revocada`,`caducada`) | **la revocación es instantánea porque el QR se valida contra esta tabla** |
  | issued_by | uuid | admin/responsable que la emitió |
  | created_at / revoked_at / revoked_by | | |

- **`access_logs`**:
  id, credential_id FK NULL, user_id FK, event enum(`entrada`,`salida`,`denegado`), method enum(`qr`,`temporal`,`nfc`,`manual`), source enum(`app`,`torno`,`manual`), center_id, recorded_by NULL, scanned_at timestamptz, meta jsonb.
  - `source='torno'` listo para la integración futura con lectores Repsol (ADR-003).
  - Horario entrada/salida = `MIN(scanned_at) FILTER (entrada)` / `MAX(...) FILTER (salida)` por user_id y fecha.

## 4. Notificaciones y push

- **`notifications`**: id, user_id, type enum(`turno`,`acceso`,`vacacion`,`corporativa`,`sistema`), title, body, data jsonb, read_at NULL, created_at.
- **`push_subscriptions`**: id, user_id, endpoint UNIQUE, p256dh, auth, created_at (Web Push VAPID, ver [[11-Estrategia-PWA]]).

## 5. Auditoría y configuración

- **`audit_logs`**: id, actor_id NULL, action text, entity text, entity_id text, old_data jsonb, new_data jsonb, ip inet, created_at.
  - Escrito por **trigger** en tablas sensibles (credentials, vacation_requests, profiles, teams).
  - `REVOKE UPDATE, DELETE` — **append-only**.
- **`app_settings`**: key PK, value jsonb, updated_by, updated_at (ej. `temporal_code_ttl_minutes`).

## 6. Índices (escala >5.000)

```sql
create index on access_logs (user_id, scanned_at desc);
create index on access_logs (center_id, scanned_at desc);
create index on access_logs (credential_id);
create index on access_logs (event, scanned_at desc);           -- métricas
create index on shift_entries (user_id, date);
create index on shift_entries (date);                           -- vista día / métricas
create index on notifications (user_id, read_at nulls first, created_at desc);
create index on vacation_requests (status, start_date);
create index on vacation_requests (user_id, created_at desc);
create index on team_members (user_id);
create index on audit_logs (created_at desc), (actor_id, created_at desc);
```
- Listas siempre con `keyset/LIMIT` + filtros por fecha.
- Métricas de asistencia (KPIs >5.000): **vista materializada** `mv_assistance_daily` (user, fecha, asistió, puntual) + refresh job; los dashboards leen de la MV.

## 7. RLS (políticas por tabla)

Funciones helper (`security definer`, `set search_path = public` para evitar recursión):
- `fn_my_role() returns user_role` → `select role from profiles where id = auth.uid()`
- `fn_is_team_leader(p_team uuid) returns boolean`

| Tabla | Lectura | Escritura |
|---|---|---|
| profiles | propio siempre; equipo si `fn_is_team_leader` o rol `admin`/`responsable` (filtros) | propio: solo campos de perfil; role/center: solo `admin` |
| centers, teams, team_members | `authenticated` | solo `admin` (líder: añadir miembros de su equipo) |
| shift_patterns, shift_entries | propio o miembro del equipo | solo `admin` |
| shift_assignments | miembro del equipo | solo `admin` |
| holidays, corporate_events | `authenticated` | solo `admin` |
| vacation_requests | propio + líder del equipo + `admin` | `INSERT` propio con `status='pendiente'` y `reviewer_id` = líder; `UPDATE` (estado) solo líder/admin |
| access_credentials | propio; líder/admin de su equipo/centro | `INSERT/UPDATE/DELETE` solo `admin`/`responsable` (revocación) |
| access_logs | líder de equipo → su equipo; `admin` → todo; empleado → los suyos | `INSERT` vía Edge Function (service role) o `responsable` (manual) |
| notifications | solo `user_id = auth.uid()` | `INSERT` service role / admin; `UPDATE read_at` propio |
| push_subscriptions | propio | `INSERT/DELETE` propio |
| audit_logs | `admin` | solo service role/trigger; sin UPDATE/DELETE |
| app_settings | `authenticated` | solo `admin` |

> Regla: **ninguna tabla queda sin RLS**; CI ejecuta `get_advisors(security)` como paso de QA.

## 8. Migraciones y seed

- `supabase/migrations/0001_ext.sql` (pgcrypto, citext), `0002_enums.sql`, `0003_identity.sql`, `0004_calendar.sql`, `0005_access.sql`, `0006_notifications.sql`, `0007_audit_rls.sql` (RLS al final, por capas).
- `supabase/seed.sql`: 2 centros, 3 equipos, ~20 usuarios (1 admin, 3 responsables, 16 empleados), 2 patrones rotativos, asignaciones 30 días, 10 festivos, 6 vacaciones variadas, 200 `access_logs`, 10 notificaciones, eventos corporativos. Datos ficticios, sin PII real.
- **Bloqueo**: el MCP Supabase no tiene permisos (`list_tables` → 403). Aplicar migraciones requiere habilitar permisos en el MCP o usar la CLI con token local.
