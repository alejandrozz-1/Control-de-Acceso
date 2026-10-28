# Estrategia de empaquetado Android (Capacitor)

**Objetivo:** generar un `.apk` **sin rehacer el desarrollo** — el mismo codebase React se empaqueta.

## Configuración
- `capacitor.config.ts` en `apps/web`:
```ts
const config: CapacitorConfig = {
  appId: 'com.repsol.controlacceso',
  appName: 'Control de Acceso',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: { PushNotifications: { presentationOptions: ['badge','sound','text'] } },
};
```
- Add: `@capacitor/core`, `@capacitor/android`, `@capacitor/cli`, `@capacitor/push-notifications`, `@capacitor/local-notifications`.

## Flujo de build
```
npm run build            # Vite → dist/ (mismo que PWA)
npx cap sync android     # copia dist/ + plugins al proyecto Android
# Android Studio → Build APK  (o gradlew assembleDebug en CI)
```
- `android/` **sí se commitea** (build reproducible en CI sin Android Studio).
- CI Fase 6: job con `ubuntu-latest` + JDK 17 + `./gradlew assembleDebug` → artefacto `app-debug.apk` en Actions.

## Adaptaciones por plataforma (solo las necesarias)
- **Capa de notificaciones abstracta**: `services/notifications.ts` con implementación `web` (Web Push) y `capacitor` (FCM vía `@capacitor/push-notifications`). La app decide por `Capacitor.isNativePlatform()`.
- **Safe areas e insets**: ya resueltos en el diseño mobile-first ([[04-Diseno-UX-UI]]).
- **QR**: pantalla a pantalla completa ya preparada; `@capacitor/barcode-scanner` queda para la fase de validación (tornos/lectores, fuera de MVP).
- **Back button**: manejar `backButton` para que cierre menús antes de salir.
- No se usa ninguna API web exclusiva sin fallback (chequeo en QA).

## Versionado
- `versionCode`/`versionName` sincronizados con el tag Git (`release/x.y.z`).
- Primera entrega: **APK debug** para pruebas internas; firma release cuando el cliente aporte keystore (o generar uno propio con guardado seguro — pendiente de decisión, ver Comunicaciones).

## NFC (futuro, no MVP)
- Decisión de alcance: solo QR + código temporal (ver [[memoria/Preguntas-resueltas]]).
- Cuando se active: `@capacitor/nfc` (lectura) y/o HCE, condicionado por los tornos de Repsol (R-02). El campo `nfc_uid` ya existe en el esquema.
