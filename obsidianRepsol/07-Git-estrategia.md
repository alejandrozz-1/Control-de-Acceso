# Estrategia Git y revisión entre agentes

Repo: https://github.com/alejandrozz-1/Control-de-Acceso

## Ramas

```
main ──────────────────────────────────●──────────► (producción, tags v1.0.0)
        \                             /
         \── release/1.0.0 ──────────/            (candidato a producción)
        /        ↑
develop ────────●───●───●─────────────            (integración, despliegue preview)
      ↑        /     /
 feature/arq-…        feature/frontend-…           (una rama por agente/tarea)
 hotfix/…             (solo desde main)
```

- `main`: siempre desplegable. Solo merge de `release/*` o `hotfix/*`.
- `develop`: integración diaria. Los agentes hacen PR aquí.
- `feature/<agente>-<descripcion>`: `feature/backend-credenciales`, `feature/frontend-acceso-qr`, `feature/qa-e2e-login`, `feature/devops-ci`, `feature/arq-adr-004`.
- `hotfix/<desc>`: nace de `main`, merge a `main` **y** `develop`.
- `release/<semver>`: congelación; solo bugs.

## Reglas entre agentes (evitar conflictos)

1. **Una tarea = una rama = un PR.** Nunca dos agentes en la misma rama.
2. **Propiedad por zona** (CODEOWNERS):
   - `supabase/**` → agente Backend
   - `apps/web/src/features/**` → el agente del módulo que la toque
   - `apps/web/src/pages/`, `components/ui/`, `app/theme*` → agente Frontend
   - `.github/**` → DevOps
   - `obsidianRepsol/adrs/**` → Arquitectura (otros agentes proponen en Comunicaciones)
   - `obsidianRepsol/memoria/**` → todos (append-only, ver abajo)
3. **Rebase diario** desde `develop` en tu rama; correr `npm run lint && npm run test` antes del PR.
4. **Conflictos**: quien detecta el conflicto lo resuelve en su rama; si el otro archivo es propiedad de otro agente, se resuelve en un PR conjuntado comentado en Comunicaciones.
5. **Memoria compartida**: en `memoria/` solo **añadir o editar tu propia entrada**; nunca reescribir archivos enteros. Si hay conflicto en `Tareas.md`/`Cambios.md`, ambos bloques se conservan (append-only).
6. Los archivos de entrega (00-13) los edita su responsable tras acuerdo en Comunicaciones; el resto solo añade enlaces.

## Merge y revisión

- Merge a `develop` por **Pull Request** con **1 aprobación** (revisión cruzada agente↔agente; QA revisa toda PR que toque lógica de negocio).
- Título: `[backend] añade emisión de credenciales temporales` (prefijo = agente).
- Cuerpo: qué, por qué (link ADR/tarea), cómo se probó.
- Squash merge en `feature`→`develop`; merge commit en `develop`→`release`→`main` (historial de release legible).
- CI verde obligatorio (lint, typecheck, tests, build, advisors-supabase en cambios de BD).
- Commits: Conventional Commits (`feat(frontend):`, `fix(backend):`, `docs(obsidian):`, `chore(devops):`).

## Cadencia
- Kickoff diario: cada agente actualiza su entrada en [[memoria/Tareas]] y handovers.
- Merge mínimo una vez al día por agente para no divergir.
