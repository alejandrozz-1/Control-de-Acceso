# Análisis de riesgos

| ID | Riesgo | Prob. | Impacto | Mitigación | Owner |
|---|---|---|---|---|---|
| R-01 | **MCP Supabase sin permisos** (`list_tables` → 403): no se puede inspeccionar/aplicar esquema desde el agente | Alta | Alto (bloquea Fase 0-BD) | Habilitar permisos en la config del MCP del usuario o usar Supabase CLI con token local; mientras, diseñar contra el modelo de [[03-Base-de-datos]] | DevOps + usuario |
| R-02 | Integración futura con **tornos/lectores Repsol**: formato/vendor desconocido → rediseño posterior | Media | Alto | [[adrs/ADR-003-credenciales-validables]]: credencial con `credential_id` estable + `access_logs.source='torno'` ya previsto; validar formato del QR con el cliente en Fase 2 | Arquitectura |
| R-03 | **Gran escala (>5.000 empleados)**: listas/métricas lentas | Media | Medio | Paginación obligatoria, índices de [[03-Base-de-datos]] §6, vistas materializadas de métricas, tests de volumen con seed grande | Backend |
| R-04 | **Web Push limitado en iOS Safari** y experiencia variable en Android Chrome | Media | Medio | Push es complemento, nunca canal único: el centro de notificaciones in-app es la fuente; Capacitor usa canales nativos en APK | Frontend |
| R-05 | **Repo y CI vacíos**: todos los agentes arrancan a la vez sobre nada | Alta | Medio | Fase 0 secuencial: DevOps publica `main`+`develop`+plantillas ANTES de que otros agentes commiteen | DevOps |
| R-06 | **Identidad de marca 2025**: tipografía/activos propietarios sin confirmar (brandcenter) | Media | Bajo | Tokens aislados ([[04-Diseno-UX-UI]]); Inter como sustituto; confirmar con cliente antes del release | UX/UI |
| R-07 | **RGPD / datos de asistencia**: trazabilidad de personas = dato sensible | Media | Alto | Mínimo privilegio (RLS), auditoría append-only, retención documentada, sin PII en QR (solo uuid firmado), cuentas de prueba en dev | Backend |
| R-08 | Conflictos entre agentes trabajando en paralelo | Media | Medio | [[07-Git-estrategia]]: propiedad por zona, 1 rama = 1 PR, rebase diario, CODEOWNERS | Todos |
| R-09 | Alcance creciente (petición de features fuera del MVP) | Media | Medio | Todo fuera de [[01-Analisis-funcional]] §5 va a backlog con decisión explícita del PO en Comunicaciones | PO |
| R-10 | Supabase free tier: límites de compute/DB para >5.000 usuarios reales | Baja | Medio | Medir en Fase 5; plan Pro si crece (coste a validar con cliente) | DevOps |

## Bloqueos activos
- **B-01**: permisos MCP Supabase (R-01). *Registrado 2026-10-28.*
- **B-02**: repo GitHub vacío; falta push inicial + secretos (Vercel, VAPID). *Registrado 2026-10-28.*

## Dependencias externas
- Cliente: assets/permisos de marca (brandcenter), definición futura de tornos, cuenta Vercel, habilitación de permisos MCP.
