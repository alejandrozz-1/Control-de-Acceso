# Estructura de carpetas del repositorio

```
Control-de-Acceso/
├── obsidianRepsol/               # Bóveda Obsidian (fuente de verdad, ver 08-Memoria-compartida)
│   ├── 00-Home.md … 13-*.md      # Entregables
│   ├── adrs/                     # ADRs (append-only)
│   └── memoria/                  # Estado global, tareas, cambios, comunicaciones, handovers/
├── apps/
│   └── web/                      # App React (único workspace por ahora)
│       ├── public/
│       │   ├── manifest.webmanifest
│       │   └── icons/
│       ├── src/
│       │   ├── app/              # router, providers, theme, guards de rol
│       │   ├── pages/            # rutas: Inicio, Calendario, Acceso, Notificaciones, Cuenta,
│       │   │                     #   + panel Responsable (registros, métricas, aprobaciones)
│       │   ├── features/         # por módulo: acceso/, calendario/, turnos/, vacaciones/,
│       │   │                     #   notificaciones/, equipos/, auditoria/
│       │   │   ├── components/   #   UI del módulo
│       │   │   ├── hooks/        #   useQuery/useMutation del módulo
│       │   │   └── store.ts      #   slice Zustand si hace falta
│       │   ├── components/ui/    # genéricos (Button, DataList, EmptyState…)
│       │   ├── services/         # cliente supabase.ts, tipos generados (database.types.ts)
│       │   ├── hooks/            # useAuth, useRole, usePush…
│       │   ├── lib/              # utils (fechas, formatos)
│       │   └── test/             # setup, helpers
│       ├── capacitor.config.ts   # (Fase 6)
│       ├── vite.config.ts        # + plugin PWA (vite-plugin-pwa)
│       └── index.html
├── supabase/
│   ├── migrations/               # 0001_*.sql … orden inmutable
│   ├── functions/                # qr-temporal/, push-send/, metrics-refresh/
│   ├── seed.sql
│   └── config.toml
├── .github/
│   ├── workflows/                # ci.yml, deploy.yml, supabase-migrate.yml
│   ├── CODEOWNERS
│   └── pull_request_template.md
├── docs/                         # solo ADRs técnicos largos si crecen; lo normal vive en Obsidian
├── package.json                  # workspaces: apps/web
├── tsconfig.base.json
└── README.md                     # apunta a obsidianRepsol/00-Home.md
```

Convenciones:
- Un módulo = una carpeta en `features/`; otros módulos importan solo su `hooks`/`components` públicos.
- Tipos de BD **generados** (`supabase gen types typescript`), nunca escritos a mano.
- Los agentes NO crean carpetas nuevas en la raíz sin proponerlo en [[memoria/Comunicaciones]].
