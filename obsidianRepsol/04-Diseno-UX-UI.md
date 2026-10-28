# Diseño UX/UI

## 1. Identidad visual — verificación (junio 2025 / actualidad)

**Hallazgo:** Repsol presentó en **junio de 2025 su primera renovación de marca en ~40 años** (fuente: servimedia, capital.es, repsol.com). Cambios:
- Nuevo emblema con **degradado naranja → magenta**, silueta de Repsol con más volumen.
- **Tipografía en minúscula** (nueva identidad tipográfica propietaria).
- **Azul Repsol "revitalizado"** (el de las estaciones de servicio) y un nuevo **marfil/ivory** como fondo expresivo.
- Identidad sonora; despliegue digital inmediato y físico progresivo durante 2025-2026.

**Decisión de diseño (justificada):**
1. Mantener la paleta base indicada por el proyecto — es la que consta en brandcenter.repsol.com: `#041E42` (azul), `#FFFFFF`, `#FF8200` (naranja), `#E4002B` (rojo) — porque coincide con la identidad vigente y **el blanco predominante** es requisito de legibilidad.
2. Asumir el azul como "azul Repsol revitalizado" (`#041E42` como token primario oscuro). Si brandcenter publica un hex actualizado, se cambia en **un solo token** (`--rps-blue`), sin tocar el resto.
3. El nuevo **marfil** se usa como fondo de superficies neutras en modo claro (`#F7F4EF` aprox., a confirmar con brandcenter) para el "aire" de la nueva identidad.
4. El **degradado naranja→magenta** se reserva para elementos decorativos puntuales (cabecera de Inicio, splash), nunca en elementos interactivos ni texto → accesibilidad intacta.
5. **Tipografía**: la tipografía nueva es propietaria y su licencia es desconocida → usar **Inter** (open source, excelente legibilidad móvil, soporta minúsculas). Si Repsol concede licencia, se sustituye en el token `fontFamily` sin más cambios.
6. **Logo**: usar el símbolo de marca actual; verificar permiso de uso y asset oficial en brandcenter antes de publicar.

> ⚠️ Pendiente (riesgo R-06): confirmar assets/tipografía en brandcenter.repsol.com con el cliente.

## 2. Tokens de color

```css
--rps-blue: #041E42;      /* primario oscuro: top bars, texto principal */
--rps-orange: #FF8200;    /* acento primario: acciones, énfasis */
--rps-red: #E4002B;       /* destructivo/alertas: revocar, rechazar */
--rps-white: #FFFFFF;     /* predominante: fondo claro */
--rps-ivory: #F7F4EF;     /* superficie neutra (nueva identidad) */
--rps-gradient: linear-gradient(90deg, #FF8200, #E4002B); /* decorativo */
```
- **Modo oscuro**: fondo `#0B1220` (azul muy oscuro derivado de `#041E42`), superficie `#111A2C`, texto `#F2F4F8`, naranja/rojo sin cambios (contraste AA verificado sobre fondo oscuro).
- Componentes MUI `CssVarsProvider` con ambos temas; preferencia del sistema + override manual persistido en perfil.

## 3. Layout mobile-first

- **Bottom Navigation** fija (5 destinos, icono + etiqueta): Inicio · Calendario · Acceso · Notificaciones · Cuenta.
  - Acceso como destino central prominente (izquierdo de center: orden Inicio, Calendario, **Acceso**, Notificaciones, Cuenta).
- Breakpoints: móvil (<600, base), tablet (600–900, dos columnas), escritorio (>900, **Drawer lateral izquierdo** sustituye la bottom bar y aparece el menú de responsable).
- Área táctil mínima **48×48 px** (WCAG 2.5.5 AAA de paso); paddings de lista generosos; `safe-area-inset-bottom` para gestos Android.
- Screens clave:
  - **Acceso**: QR a pantalla completa con fondo azul `#041E42`, botón "código temporal", estado (activa/revocada), temporizador de caducidad.
  - **Inicio**: saludo + turno de hoy + accesos rápidos (solo vacío si no hay nada → diseño empty states).
  - **Calendario**: vista mes con leyenda de color por tipo de día.
  - **Notificaciones**: lista con swipe marcar leída, badge en la bottom bar.
  - **Responsable**: secciones extra (métricas, registros, aprobaciones) — misma bottom bar, contenido con tabs superiores.

## 4. Accesibilidad (WCAG 2.1 AA)

- Contraste mínimo 4.5:1 (texto) / 3:1 (texto grande y componentes) — la paleta base cumple; verificar naranja `#FF8200` sobre blanco → **usar naranja solo para fondos/iconos o texto ≥18.66px bold**, nunca para texto pequeño sobre blanco.
- Navegación por teclado completa, foco visible (`:focus-visible`), ARIA en bottom nav (`aria-current="page"`), live regions en el QR/t temporales.
- `prefers-reduced-motion`, escalado de fuente 200% sin cortes.
- Lighthouse ≥ 90 en accesibilidad (gate en CI, ver [[09-Plan-de-testing]]).

## 5. Preparación app instalada

- Safe areas, sin scroll horizontal, CTAs fijos inferiores, gestos táctiles sin hover-dependencia.
- El diseño es el mismo para PWA y APK (Capacitor): los componentes no cambian, solo el shell.
