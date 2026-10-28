---
adr: 001
estado: aceptado
fecha: 2026-10-28
agentes: [arquitectura, frontend]
---

# ADR-001 — Stack frontend

## Contexto
App web mobile-first empresarial, preparada para PWA y APK vía Capacitor, con equipo de agentes trabajando en paralelo. Requisito del proyecto: React 19, TypeScript, Vite, MUI, React Router, TanStack Query, Zustand/Redux.

## Decisión
- **React 19 + TypeScript + Vite** (build rápido, HMR, ESM).
- **MUI (Material UI)** como librería empresarial: tema claro/oscuro con `CssVarsProvider`, componentes accesibles probados, densidad adaptable para mobile-first.
- **React Router v7** (modo librería, no framework mode) → sigue siendo un SPA estático compatible con Vercel y Capacitor (`webDir: dist`).
- **TanStack Query** para todo dato remoto (caché, reintentos, invalidación, optimistic UI).
- **Zustand** para estado de sesión/UI no remoto (ligero, sin boilerplate). *No* Redux Toolkit: no aporta nada extra sobre Zustand + TanStack Query en este alcance.
- **vite-plugin-pwa** para el service worker.

## Consecuencias
- `supabase-js` como único SDK de datos → la autorización vive en RLS (ADR-002).
- MUI pesa ~100 kB; se acepta con code-split por ruta y `babel-plugin-import`/tree-shaking.
- Redux queda descartado salvo que aparezca un requisito que lo justifique (re-evaluar en ADR nuevo).

## Alternativas descartadas
- Next.js: SSR innecesario (todo es tras auth) y complica el empaquetado con Capacitor.
- Redux Toolkit: más ceremonia sin beneficio.
- Tailwind: el proyecto pide MUI o equivalente empresarial; MUI cubre tema/a11y out of the box.
