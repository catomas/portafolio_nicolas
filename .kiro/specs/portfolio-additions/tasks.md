# Implementation Plan

## Overview

Plan de implementación para las 3 adiciones al portafolio de Nicolás Restrepo: foto del fotógrafo en About, sección de Contacto con formulario visual, y sección de Marcas con carrusel marquee + grid de cards + lightbox por marca. Se integra con la arquitectura existente (datos centralizados, paletas CSS, componentes React + Tailwind).

## Tasks

- [x] 1. Extender tipos e interfaces en `src/data/types.ts`
  - Agregar interfaz `Brand` con campos: `id`, `name`, `logoUrl`, `coverPhotoUrl`, `photos: string[]`
  - Agregar interfaz `ContactData` con campos: `title`, `subtitle?`
  - Extender `AboutData` con campo opcional `photographerPhotoUrl?: string`
  - Extender `SiteData` con campos opcionales `brands?: Brand[]` y `contact?: ContactData`
  - Verificar que TypeScript compila sin errores y que los componentes existentes no se rompen

- [x] 2. Extender datos mock en `src/data/siteData.ts`
  - Agregar `photographerPhotoUrl` con URL de Unsplash (retrato) en el objeto `about`
  - Agregar array `brands` con al menos 4 marcas mock (cada una con logo, foto portada, y 3+ fotos de proyecto)
  - Agregar objeto `contact` con título "Contacto" y subtítulo placeholder
  - Verificar que TypeScript compila y los datos cumplen las interfaces

- [x] 3. Modificar `AboutSection` para incluir foto del fotógrafo
  - Agregar `<img>` que muestre `siteData.about.photographerPhotoUrl`
  - Implementar layout responsivo: dos columnas en desktop (foto izquierda, bio derecha) con `md:flex md:gap-8`, una columna en mobile (foto arriba, bio abajo)
  - Foto con `max-w-[300px]`, `object-fit: contain`, proporción preservada
  - Implementar fallback: si `photographerPhotoUrl` es vacío/undefined, no renderizar imagen y usar layout centrado
  - Implementar `onError`: si la imagen falla al cargar, ocultar el contenedor de imagen sin espacios residuales
  - Usar colores de paleta activa

- [x] 4. Crear `ContactSection` y `ContactForm`
  - Crear `src/components/ContactSection.tsx`: título desde `siteData.contact?.title` o fallback "Contacto", subtítulo opcional
  - Crear `src/components/ContactForm.tsx`: campos nombre (text, required), email (email, required), mensaje (textarea, required), botón "Enviar"
  - `onSubmit`: `e.preventDefault()` — sin funcionalidad real por ahora
  - Responsivo: full width en mobile, `max-w-xl` centrado en desktop
  - Colores de paleta en inputs, bordes, focus states, y botón
  - Agregar `id="contact"` a la sección para navegación

- [x] 5. Crear `BrandMarquee` con CSS animation
  - Crear `src/styles/marquee.css` con `@keyframes marquee-scroll` (translateX 0 → -50%)
  - Crear `src/components/BrandMarquee.tsx`: contenedor con `overflow: hidden`, track que duplica logos para loop infinito
  - Cada logo: `<img>` con altura máxima 48px, `object-fit: contain`, separación uniforme entre logos
  - Pausar animación en hover (`animation-play-state: paused`)
  - Importar `marquee.css` en el componente o en `index.css`

- [x] 6. Crear `BrandCard` y `BrandGrid`
  - Crear `src/components/BrandCard.tsx`: logo (32px altura, arriba), foto portada (imagen principal con proporción preservada), nombre de marca
  - Si `brand.photos.length === 0`: deshabilitar click (sin cursor pointer, opacidad reducida)
  - Colores de paleta activa para fondo, texto, bordes
  - Crear `src/components/BrandGrid.tsx`: grid responsivo `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` con gap
  - Renderizar un `BrandCard` por cada marca del array

- [x] 7. Crear `BrandLightbox`
  - Crear `src/components/BrandLightbox.tsx` que reciba: `photos: string[]`, `brandName: string`, `isOpen: boolean`, `onClose: () => void`
  - Modal fullscreen con backdrop oscuro semi-transparente
  - Mostrar nombre de marca como título sobre la imagen
  - Navegación cíclica prev/next con botones visuales
  - Navegación por teclado: ← →, cierre con Escape
  - Cierre con clic fuera de la imagen y botón ×
  - Bloquear scroll del body mientras está abierto

- [x] 8. Crear `BrandsSection` que integre marquee + grid + lightbox
  - Crear `src/components/BrandsSection.tsx` que renderice `BrandMarquee` + `BrandGrid`
  - Si `siteData.brands` es undefined o vacío, retornar `null`
  - Gestionar estado del `BrandLightbox`: marca seleccionada, isOpen, currentPhotoIndex
  - Al hacer click en un `BrandCard`, abrir `BrandLightbox` con las fotos de esa marca
  - Agregar `id="brands"` a la sección para navegación

- [x] 9. Modificar `Navbar` para incluir enlaces a nuevas secciones
  - Agregar links: `{ label: 'Marcas', targetId: 'brands' }` y `{ label: 'Contacto', targetId: 'contact' }`
  - Link "Marcas" condicional: solo mostrar si `siteData.brands` tiene elementos
  - Actualizar `IntersectionObserver` para observar las nuevas secciones (brands, contact)
  - Actualizar menú mobile para incluir los nuevos enlaces
  - Verificar que el highlight de sección activa funciona con las nuevas secciones

- [x] 10. Modificar `App.tsx` para integrar todas las nuevas secciones
  - Importar `BrandsSection` y `ContactSection`
  - Renderizar en orden: Navbar → HeroSection → GallerySection → BrandsSection → AboutSection → ContactSection → Lightbox
  - Verificar que `npm run build` compila sin errores
  - Verificar visualmente que todas las secciones se renderizan correctamente con la paleta activa
  - Verificar scroll suave desde Navbar hacia cada nueva sección

## Task Dependency Graph

```json
{
  "waves": [
    [1],
    [2],
    [3, 4, 5, 6, 7],
    [8, 9],
    [10]
  ]
}
```

## Notes

- **Fase 1 (sin backend)**: El formulario de contacto solo previene submit. En Fase 2 se conecta a Formspree/EmailJS.
- **Marcas mock**: Usamos logos de Wikipedia/Unsplash como placeholder. Se reemplazan cuando Nico tenga logos y fotos reales.
- **Compatibilidad**: Los campos `brands` y `contact` son opcionales — el portafolio funciona sin ellos sin errores.
- **Orden de secciones**: Hero → Galería → Marcas → About → Contacto (validado con el cliente).
