# Estrategia PWA

## Stack
- **`vite-plugin-pwa`** (Workbox, generación automática del service worker).

## Manifest (`manifest.webmanifest`)
```json
{
  "name": "Control de Acceso Repsol",
  "short_name": "Acceso Repsol",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/",
  "scope": "/",
  "background_color": "#FFFFFF",
  "theme_color": "#041E42",
  "icons": [ { "src": "/icons/icon-192.png" }, { "src": "/icons/icon-512.png", "sizes": "512x512" },
             { "src": "/icons/maskable-512.png", "purpose": "maskable" } ]
}
```

## Service worker
- **Precache**: shell de la app (HTML/JS/CSS con hash) → funciona offline de lectura.
- **Runtime cache** (`NetworkFirst`): respuestas Supabase GET → el usuario ve su calendario/turnos sin conexión.
- **Nunca cachear**: `POST/PUT` de credenciales ni Auth.
- Actualización: prompt "hay nueva versión" (evita quedar pegado a un SW viejo).

## Push (decisión: Web Push + VAPID)
- Par VAPID generado en Supabase (secretos en Edge Function `push-send`).
- Suscripción guardada en `push_subscriptions` (ver [[03-Base-de-datos]] §4).
- Flujo: Edge Function `notifications` → `web-push` a los endpoints del usuario → SW `push` event → `showNotification`.
- `Notification.requestPermission()` tras acción explícita del usuario (no al cargar).
- Fallback: si el permiso está denegado o iOS no soporta, el centro de notificaciones in-app sigue funcionando (R-04).

## Instalabilidad
- Detectar `beforeinstallprompt` → botón "Instalar" en Cuenta.
- A11y y offline mínimo: la pantalla **Acceso** se cachea para que el QR sea visible sin red (la validación de estado requiere red → si no hay conexión, se muestra aviso de "no verificado").

## Medición
- Lighthouse PWA ≥ 90 + instalación manual en Android como gate de Fase 6 ([[09-Plan-de-testing]]).
