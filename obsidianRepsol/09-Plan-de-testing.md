# Plan de testing

Agente QA responsable. Gates en CI (ver [[07-Git-estrategia]]).

## 1. Pirámide

| Nivel | Herramienta | Cobertura objetivo | Gate CI |
|---|---|---|---|
| Unitario | Vitest | lógica pura (fechas/turnos, generación de códigos, cálculo de días de vacación) | ✅ |
| Componente | Vitest + React Testing Library | cada `features/*/components` con estados: vacío, carga, error, datos | ✅ |
| Integración BD/RLS | `supabase test db` (pgTAP) | **cada tabla: un rol no autorizado NO lee/escribe** | ✅ en cambios de `supabase/` |
| E2E | Playwright (móvil 390×844 + desktop) | flujos críticos (ver §2) | ✅ en PRs a develop |
| Accesibilidad | axe-core + Lighthouse | ≥90 a11y, 0 violaciones críticas | ✅ en e2e |
| Rendimiento | Lighthouse CI | perf ≥85, LCP <2.5s | ❌ warn |
| Seguridad | `supabase get_advisors(security)` + revisión manual OWASP checklist | 0 avisos de RLS | ✅ en cambios de BD |

## 2. Flujos e2e críticos

1. Login + redirección por rol (empleado / responsable / admin).
2. Alta de usuario por admin → invitación → primer login.
3. Empleado: abrir Acceso → QR visible → código temporal con countdown → caduca.
4. Responsable: revocar credencial → el QR dejó de validarse (test negativo).
5. Vacaciones: solicitar → notificación al líder → aprobar → cambio de estado + notificación al empleado.
6. Turnos: asignar patrón → `shift_entries` generadas → calendario muestra el turno correcto en fecha futura.
7. Registros: filtrar por fecha/centro → exportar CSV.
8. Dark mode + preferencia persistida.
9. RBAC negativo: empleado intenta acceder a `/responsable` por URL → bloqueado **y** la query RLS devuelve vacío.
10. Push: suscripción VAPID registrada (mock del service worker).

## 3. Datos de prueba
- `supabase/seed.sql` determinista (mismos UUIDs) → los tests e2e dependen de él.
- Ninguna credencial real; usuarios `admin@test.local`, etc.

## 4. Defectos
- Severidad S1 (seguridad/datos) bloquea merge; S2 bloquea release; S3 entra a backlog.
- Registro en `memoria/Tareas.md` como tarea `bug-<id>` con agente y severidad.

## 5. QA manual pre-release (Fase 7)
- Matriz de dispositivos: Android 10+ (WebView), Chrome desktop, Safari iOS (PWA).
- Instalación PWA + APK Capacitor en dispositivo físico.
- Revisión a11y con teclado y TalkBack/VoiceOver.
