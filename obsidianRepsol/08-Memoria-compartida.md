# Sistema de memoria compartida (protocolo obligatorio)

Bóveda **Obsidian** en `/obsidianRepsol`, versionada con Git. Es la **fuente de verdad** del proyecto: cualquier decisión no escrita aquí no existe.

## Principios
1. **Append-only**: nadie elimina información histórica. Se corrige añadiendo una entrada nueva en `memoria/Cambios.md` con motivo.
2. **Trazabilidad**: cada entrada lleva `autor (agente)`, `fecha`, `tarea/ADR relacionado`.
3. **Un solo estado por fuente**: el estado de tareas vive en `Tareas.md`; los riesgos en `Estado-global.md`; las decisiones técnicas en `adrs/`; las decisiones de negocio en `Preguntas-resueltas.md`.

## Estructura de memoria

| Archivo | Contenido | Escritura |
|---|---|---|
| `memoria/Estado-global.md` | Riesgos, bloqueos, dependencias, salud del proyecto | cualquier agente (edita sus filas) |
| `memoria/Tareas.md` | Tablas: ⬜ Pendiente / 🔄 En curso / ✅ Finalizada | dueño de la tarea + quien la asigna |
| `memoria/Cambios.md` | Qué, quién, cuándo, enlace a commit/PR | automático al cerrar tarea |
| `memoria/Comunicaciones.md` | Propuestas, decisiones, acuerdos entre agentes | cualquier agente (nuevo hilo al final) |
| `memoria/Preguntas-resueltas.md` | Decisiones del PO (fase inicial) | PO/Product Owner |
| `memoria/Handovers/<agente>-<fecha>.md` | Qué dejé hecho, cómo probarlo, qué sigue, qué rompí | al cerrar tarea |

## Flujo obligatorio de cada agente/subagente

### Antes de empezar (obligatorio ANTES de tocar código de la app)
```
1. git pull (tu rama / develop)
2. Leer: 00-Home → memoria/Estado-global → memoria/Tareas → memoria/Comunicaciones
   → handovers recientes → git log reciente (qué están haciendo AHORA los demás)
   → ADRs implicados
3. DECIDIR qué vas a hacer y escribirlo en Tareas.md, columna "Plan" de tu fila
   "🔄 En curso" (agente + fecha + qué tocas + qué NO tocas)
4. commit -m "docs(obsidian): <agente> toma tarea <id> — <resumen del plan>"
   && push develop && push develop:main     ← SOLO obsidian, ANTES de tocar código
5. Recién entonces: empezar los cambios en la app
```

Si no está en `git log` el commit `docs(obsidian): … toma tarea …`, ese agente aún no ha
empezado; si está, ya se sabe qué va a hacer sin preguntar.

### Al terminar
```
1. Actualizar la documentación que tu cambio haya invalidado (entregables 00-13)
2. Registrar en memoria/Cambios.md: qué cambió, por qué, link PR/commit
3. Registrar riesgos nuevos en memoria/Estado-global.md
4. Dejar pendientes explícitos (si los hay) en Tareas.md
5. Crear memoria/Handovers/<agente>-<fecha>-<tarea>.md
6. Mover tarea a "✅ Finalizada"
7. commit + push de TODO (código y docs juntos)
```

## Reglas de edición
- **Markdown con frontmatter mínimo** en handovers: `agente`, `fecha`, `tarea`, `estado`.
- Usar `[[wikilinks]]` entre documentos para que Obsidian navegue.
- No borrar tablas: añadir filas. Para reescribir una sección, mover el contenido antiguo bajo `> Archivo histórico` y dejar el nuevo arriba.
- Si dos agentes editan el mismo archivo: rebase, conservar ambas aportaciones, comentarlo en `Comunicaciones.md`.

## Plantilla de handover
```markdown
---
agente: frontend
fecha: YYYY-MM-DD
tarea: T-0xx
estado: done | blocked
---
# Handover: <tarea>
## Hecho
## Cómo probarlo
## Siguiente paso sugerido
## Riesgos/pending
```
