# Requirements Document

## Introduction

Este documento define los requisitos para el Palette Switcher, un componente UI que permite al usuario final (Nicolás, el cliente fotógrafo) previsualizar y cambiar entre las 4 paletas de colores del portafolio en tiempo real. El objetivo es que pueda ver el mockup con cada paleta y decidir cuál prefiere.

## Glossary

- **Paleta**: Conjunto de 4 colores CSS (bg-primary, bg-secondary, text-primary, accent) que definen el look del sitio.
- **Swatch**: Elemento visual circular que muestra el color representativo de una paleta.
- **PaletteSwitcher**: Componente flotante que contiene los swatches y permite la selección.
- **CSS Custom Property**: Variable CSS definida en `:root` (ej: `--color-bg-primary`).

## Requirements

### Requirement 1: Palette Data Registry

El sistema debe definir las 4 paletas de colores como un módulo TypeScript exportable con estructura tipada.

**User Story:** Como desarrollador, quiero tener las paletas definidas como datos tipados en TypeScript para poder referenciarlas programáticamente desde el context y el componente UI.

#### Acceptance Criteria

- [ ] 1.1. Given el módulo de paletas, when se importa, then exporta un array `PALETTES` con exactamente 4 objetos tipo `Palette`.
- [ ] 1.2. Given cada paleta en el registry, when se inspecciona, then contiene un `id` (string kebab-case único), `name` (string descriptivo), y un objeto `colors` con las propiedades `bgPrimary`, `bgSecondary`, `textPrimary`, y `accent` como strings hex válidos.
- [ ] 1.3. Given las paletas definidas, when se listan sus ids, then son: `dark-classic`, `warm-cream`, `neutral-gray`, `clean-white`.

### Requirement 2: Palette Context Provider

El sistema debe proveer un React Context que gestione el estado de la paleta activa y permita cambiarla.

**User Story:** Como componente del sistema, necesito un context centralizado que gestione qué paleta está activa para que todos los componentes reaccionen al cambio.

#### Acceptance Criteria

- [ ] 2.1. Given el `PaletteProvider` montado, when un componente hijo llama `usePaletteContext()`, then recibe un objeto con `activePaletteId` (string), `setPalette` (función), y `palettes` (array de Palette).
- [ ] 2.2. Given un componente fuera del `PaletteProvider`, when llama `usePaletteContext()`, then se lanza un error descriptivo.
- [ ] 2.3. Given el `PaletteProvider` al montar, when existe un valor válido en `localStorage` key `selected-palette`, then `activePaletteId` se inicializa con ese valor.
- [ ] 2.4. Given el `PaletteProvider` al montar, when no existe valor en `localStorage` o el valor no corresponde a un id válido, then `activePaletteId` se inicializa como `dark-classic`.

### Requirement 3: Aplicación de CSS Custom Properties

El sistema debe aplicar las variables CSS de la paleta activa en el `document.documentElement` para que todos los componentes reflejen el cambio.

**User Story:** Como usuario (Nicolás), quiero que al seleccionar una paleta todos los colores del sitio cambien instantáneamente para poder comparar cómo se ve cada opción.

#### Acceptance Criteria

- [ ] 3.1. Given una paleta seleccionada, when se llama `setPalette(paletteId)`, then las properties `--color-bg-primary`, `--color-bg-secondary`, `--color-text-primary`, y `--color-accent` en `:root` se actualizan con los valores de esa paleta.
- [ ] 3.2. Given un cambio de paleta, when las CSS variables se actualizan, then todos los elementos que usan esas variables via Tailwind (bg-bg-primary, text-text-primary, etc.) reflejan los nuevos colores sin recarga de página.
- [ ] 3.3. Given un cambio de paleta, when se aplican las nuevas variables, then la transición de colores es suave (CSS transition aplicado a los elementos de la página).

### Requirement 4: Persistencia en localStorage

El sistema debe persistir la paleta seleccionada en `localStorage` para que sobreviva entre sesiones.

**User Story:** Como usuario (Nicolás), quiero que mi selección de paleta se recuerde entre visitas para no tener que re-seleccionarla cada vez que vuelvo al sitio.

#### Acceptance Criteria

- [ ] 4.1. Given que el usuario selecciona una paleta, when se llama `setPalette(paletteId)`, then el valor se guarda en `localStorage` con la key `selected-palette`.
- [ ] 4.2. Given que la página se recarga, when el `PaletteProvider` se monta, then restaura la paleta guardada en `localStorage`.
- [ ] 4.3. Given que `localStorage` no está disponible (ej: privacidad del browser), when se intenta leer/escribir, then el sistema funciona normalmente usando solo el state de React (sin persistencia), sin lanzar errores al usuario.

### Requirement 5: Componente UI PaletteSwitcher

El sistema debe renderizar un componente flotante que muestra las paletas disponibles y permite seleccionarlas.

**User Story:** Como usuario (Nicolás), quiero un botón visible en el sitio que me permita ver y seleccionar entre las paletas de colores disponibles para elegir la que más me gusta.

#### Acceptance Criteria

- [ ] 5.1. Given la página cargada, when el usuario mira la interfaz, then hay un botón flotante visible en la esquina inferior derecha con un ícono de paleta/tema.
- [ ] 5.2. Given el botón flotante, when el usuario hace click, then se despliega un panel con 4 swatches (uno por cada paleta) mostrando el color de acento de cada paleta.
- [ ] 5.3. Given el panel abierto, when el usuario hace click en un swatch, then la paleta activa cambia a la correspondiente y el panel puede permanecer abierto para comparar.
- [ ] 5.4. Given el panel abierto, when se observa el swatch de la paleta activa, then tiene un indicador visual diferenciado (borde, checkmark, o escala) respecto a los demás swatches.
- [ ] 5.5. Given el panel abierto, when el usuario hace click fuera del panel o en el botón toggle, then el panel se cierra.
- [ ] 5.6. Given el componente en viewport mobile (<768px), when se renderiza, then el botón y panel son usables y no obstruyen el contenido principal de forma permanente.

### Requirement 6: Accesibilidad

El componente debe ser accesible según estándares WCAG básicos.

**User Story:** Como usuario con necesidades de accesibilidad, quiero poder usar el palette switcher con teclado y lector de pantalla para poder seleccionar una paleta sin depender del mouse.

#### Acceptance Criteria

- [ ] 6.1. Given el botón de toggle, when se inspecciona, then tiene un `aria-label` descriptivo (ej: "Cambiar paleta de colores").
- [ ] 6.2. Given el panel de swatches, when se inspecciona, then usa `role="radiogroup"` con `aria-label`, y cada swatch usa `role="radio"` con `aria-checked` y `aria-label` indicando el nombre de la paleta.
- [ ] 6.3. Given el panel abierto, when el usuario usa teclado, then puede navegar entre swatches con Tab/Arrow keys y seleccionar con Enter/Space.
- [ ] 6.4. Given cualquier paleta activa, when se renderiza el switcher, then los elementos del switcher mantienen contraste suficiente para ser legibles (el botón flotante usa colores que contrastan con todas las paletas).
