# Implementation Plan: Palette Switcher

## Overview

Plan de implementación para el Palette Switcher, un componente flotante que permite cambiar entre las 4 paletas de colores del portafolio en tiempo real. La implementación sigue el orden: datos → context → componente UI → integración → refactor CSS → tests.

## Tasks

- [ ] 1. Crear módulo de datos de paletas
  - [ ] 1.1 Crear archivo `src/data/palettes.ts` con la interfaz `PaletteColors`, la interfaz `Palette`, y la constante exportada `PALETTES` conteniendo las 4 paletas (dark-classic, warm-cream, neutral-gray, clean-white) con sus valores hex exactos tomados de `palettes.css`.
  - [ ] 1.2 Exportar también un `DEFAULT_PALETTE_ID = 'dark-classic'` y una constante `STORAGE_KEY = 'selected-palette'`.

- [ ] 2. Crear PaletteContext y Provider
  - [ ] 2.1 Crear archivo `src/context/PaletteContext.tsx` con interfaz `PaletteContextValue` (`activePaletteId`, `setPalette`, `palettes`), el Context creado con `createContext`, y hook `usePaletteContext()` que lanza error si se usa fuera del Provider.
  - [ ] 2.2 Implementar `PaletteProvider` que al montar lee `localStorage`, valida el id, mantiene `activePaletteId` en state, expone `setPalette` que actualiza state + CSS vars + localStorage, y maneja gracefully localStorage no disponible con try/catch.
  - [ ] 2.3 Implementar función helper `applyPalette(palette: Palette)` que llama a `document.documentElement.style.setProperty` para las 4 CSS variables.

- [ ] 3. Crear componente PaletteSwitcher
  - [ ] 3.1 Crear archivo `src/components/PaletteSwitcher.tsx` con botón flotante fixed en bottom-right con ícono de paleta, state `isOpen` para toggle del panel, y panel con 4 swatches circulares mostrando el color `accent` de cada paleta.
  - [ ] 3.2 Implementar indicador visual de paleta activa (ring/borde en el swatch seleccionado).
  - [ ] 3.3 Implementar cierre del panel al hacer click fuera (event listener o ref-based detection).
  - [ ] 3.4 Agregar atributos de accesibilidad: `aria-label` en el botón toggle, `role="radiogroup"` en el panel, `role="radio"` + `aria-checked` + `aria-label` en cada swatch.
  - [ ] 3.5 Agregar navegación por teclado: Tab entre swatches, Enter/Space para seleccionar.

- [ ] 4. Integrar en App.tsx
  - [ ] 4.1 Envolver el contenido de `App.tsx` con `<PaletteProvider>`.
  - [ ] 4.2 Agregar `<PaletteSwitcher />` como último hijo dentro del Provider (después de `<Lightbox />`).
  - [ ] 4.3 Agregar CSS transition suave en `index.css` para las propiedades de color en body/html (`transition: background-color 0.3s, color 0.3s`).

- [ ] 5. Simplificar palettes.css
  - [ ] 5.1 Actualizar `src/styles/palettes.css` para que solo contenga los valores de Dark Classic en `:root`, eliminando los bloques comentados.
  - [ ] 5.2 Verificar que el build (`npm run build`) compila sin errores y la paleta default se aplica correctamente.

- [ ] 6. Testing
  - [ ] 6.1 Escribir test unitario para lógica de inicialización: con localStorage vacío retorna default, con id válido retorna ese id, con id inválido retorna default.
  - [ ] 6.2 Escribir test de componente para `PaletteSwitcher`: panel se abre/cierra, click en swatch llama `setPalette`, swatch activo tiene `aria-checked="true"`.
  - [ ] 6.3 Escribir property-based test con fast-check: para cualquier paleta del registry, `applyPalette` setea exactamente las 4 CSS properties esperadas con los valores correctos.
  - [ ] 6.4 Ejecutar `npm run test` y verificar que todos los tests pasan.

## Task Dependency Graph

```json
{
  "waves": [
    ["1"],
    ["2"],
    ["3"],
    ["4"],
    ["5"],
    ["6"]
  ]
}
```

Tasks 1-5 son secuenciales (cada una depende de la anterior). Task 6 (testing) depende de que todas las anteriores estén completas.

## Notes

- No se agregan dependencias externas nuevas — todo usa React Context + browser APIs
- fast-check ya está instalado como devDependency para property-based testing
- La paleta default (Dark Classic) se mantiene como fallback en CSS para que el sitio funcione sin JavaScript
