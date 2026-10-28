# Análisis funcional completo

**Proyecto:** App web mobile-first de control de accesos corporativos — Repsol
**Alcance aprobado:** MVP completo funcional (ver [[memoria/Preguntas-resueltas]])

## 1. Actores y roles (RBAC)

| Rol | Código | Permisos |
|---|---|---|
| Empleado | `empleado` | Ver su credencial, su calendario, sus turnos, solicitar vacaciones, ver sus notificaciones, gestionar su perfil |
| Responsable/Supervisor | `responsable` | Todo lo del empleado + gestionar su equipo: accesos masivos/revocación, registros y horarios del equipo, aprobaciones, métricas |
| Administrador | `admin` | Todo + alta de usuarios, equipos, turnos, festivos, eventos, notificaciones corporativas, auditoría, configuración |

- El rol se compone de: **rol global** (`profiles.role`) + **rol por equipo** (`team_members.role` = `miembro`/`lider`).
- Principio de mínimo privilegio: todo permiso se deriva de estas dos fuentes; RLS en BD lo hace obligatorio (ver [[03-Base-de-datos]]).

## 2. Funcionalidades — Empleado

### 2.1 Acceso a instalaciones
- **Código QR**: genera una credencial QR en la pantalla "Acceso". El QR apunta a un `credential_id` cuyo estado se valida en servidor → **revocable al instante** (requisito clave de seguridad).
- **Código temporal**: código de 6-8 dígitos con caducidad corta (defecto 5 min, configurable) como alternativa cuando no hay cámara/QR.
- **NFC**: fuera del MVP (decidido). El modelo de datos ya previene el campo `nfc_uid` para fase futura.
- *Futura validación en tornos/lectores Repsol*: ver [[adrs/ADR-003-credenciales-validables]] — el QR/NFC de hoy debe poder leerse mañana desde hardware; el esquema y los `access_logs` ya lo contemplan (`source = torno`).

### 2.2 Calendario laboral
- Vista mensual/semanal con: turnos del día, festivos (nacionales + autonómicos por centro), vacaciones/aprobadas, eventos corporativos.
- Turnos asignados por patrón rotativo (ver 3.2).

### 2.3 Cuenta
- Perfil personal (nombre, nº empleado, centro, equipo, teléfono).
- Preferencias de notificaciones (push, email, tipos de evento).
- Métodos de autenticación: email+contraseña (MVP), MFA preparado (futura, ver ADR-002).

## 3. Funcionalidades — Responsable/Administrador

### 3.1 Gestión de accesos
- **Alta masiva**: generar credenciales para N trabajadores (selección por equipo/centro/filtros).
- **Revocación** individual o masiva (inmediata, efectiva porque el QR se valida en servidor).
- **Registro de accesos**: listado filtrable (fecha, centro, persona, evento), exportación CSV.
- **Horarios entrada/salida**: derivados de `access_logs` (primera entrada / última salida por persona y día).

### 3.2 Calendario, turnos y ausencias
- Definir **patrones de turnos rotativos** (ej. 4 mañana / 2 tarde / 2 noche / 2 libre) con ciclo y color.
- Asignar patrones a equipos con fecha de inicio y offset de rotación.
- Festivos: alta con ámbito `nacional` / `comunidad` / `centro`.
- **Vacaciones y ausencias**: solicitudes con estados `pendiente → aprobada | rechazada`; aprobador = líder de equipo o admin; control de días disponibles.

### 3.3 Equipos
- CRUD de equipos, asignación a centro, alta/baja de miembros, designación de líder.

### 3.4 Notificaciones y comunicaciones
- Comunicación interna dirigida a: todos / centro / equipo / persona.
- Avisos de acceso (credencial emitida/revocada), cambios de turno, aprobaciones.
- Centro de notificaciones con lectura/no leída.

### 3.5 Métricas de asistencia
- KPIs por equipo/centro y rango: asistencia %, puntualidad (retrasos vs turno), ausencias, accesos por centro.
- Gráficas simples (mensual) + tabla exportable. A partir de >5.000 empleados: consultas pre-agregadas, ver [[03-Base-de-datos]] §6.

## 4. Historias de usuario prioritarias (MVP)

| # | Rol | Como… | Quiero… | Para… |
|---|---|---|---|---|
| US-01 | admin | administrador | dar de alta usuarios por formulario o CSV con invitación por email | que cada empleado tenga cuenta sin auto-registro |
| US-02 | empleado | empleado | ver mi QR y código temporal en "Acceso" | acceder a las instalaciones |
| US-03 | responsable | responsable | revocar credenciales individual o masivamente | cortar accesos de inmediato |
| US-04 | empleado | empleado | ver mi turno del día y el calendario mensual | saber cuándo trabajo |
| US-05 | empleado | empleado | solicitar vacaciones | que se las apruebe mi líder |
| US-06 | responsable | líder | aprobar/rechar solicitudes del equipo | controlar ausencias |
| US-07 | responsable | responsable | consultar registros y horarios del equipo | auditar entradas/salidas |
| US-08 | admin | administrador | definir patrones rotativos y asignarlos a equipos | automatizar turnos |
| US-09 | empleado | empleado | recibir avisos de cambio de turno | estar informado |
| US-10 | admin | administrador | ver métricas de asistencia por equipo/centro | detectar incidencias |
| US-11 | admin | administrador | crear eventos corporativos | comunicarlos con push |

## 5. Fuera de alcance (MVP)

- Validación física en tornos/lectores (solo emisión; esquema preparado).
- NFC en la app (fase futura, requiere Capacitor + hardware).
- SSO corporativo Repsol, MFA efectivo (solo "preparado").
- Multiempresa/multi-tenant.
- App iOS nativa (Capacitor lo permite después sin rehacer).
- Integración con sistema RRHH externo.

## 6. Reglas de negocio clave

1. Una credencial **revocada** deja de ser válida aunque se muestre el QR (validación servidor-side).
2. El código temporal caduca por tiempo y por usos (máx. N intentos).
3. Solo líder del equipo o admin pueden aprobar solicitudes de ese equipo.
4. Los festivos aplican según el centro del empleado.
5. Toda acción sensible genera registro de auditoría (quién, qué, cuándo, antes/después).
6. >5.000 empleados: toda lista paginada, toda métrica pre-agregada o indexada.
