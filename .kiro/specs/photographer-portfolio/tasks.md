# Implementation Plan

## Overview

Plan de implementación para el portafolio de fotografía de Nicolás Restrepo. Enfoque "Visual First": frontend estático con datos mock para validar el diseño visual antes de conectar base de datos. Stack: React + Vite + Tailwind CSS + TypeScript, deploy en Vercel.

## Tasks

- [x] 1. Scaffold del proyecto Vite + React + Tailwind + TypeScript
  - [x] 1.1 Inicializar proyecto con Vite usando template `react-ts` en `/Users/a69447/Documents/Personal/portafolio_nico`, instalar dependencias: `tailwindcss`, `@tailwindcss/vite`, configurar `vite.config.ts` con plugin de React y Tailwind
  - [x] 1.2 Configurar `tsconfig.json` y `tsconfig.app.json` con strict mode, crear `vercel.json` con rewrite `{ "source": "/(.*)", "destination": "/index.html" }`
  - [x] 1.3 Crear `index.html` con meta tags básicos y título "Nicolás Restrepo — Fotografía", crear `src/main.tsx` como entry point, verificar que `npm run build` produce `dist/` sin errores

- [x] 2. Sistema de paletas CSS y estilos base
  - [x] 2.1 Crear `src/styles/palettes.css` con 4 paletas como variables CSS en `:root` (Dark Classic activa, Warm Cream/Neutral Gray/Clean White comentadas)
  - [x] 2.2 Crear `src/index.css` que importe Tailwind y `palettes.css`, definir `@theme` con tokens de color y tipografía (Inter), definir estilos base en `@layer base`: html con font-family, background y color desde variables; body con margin 0 y min-height 100svh
  - [x] 2.3 Verificar que cambiar la paleta activa (descomentar otra) cambia los colores en toda la app

- [x] 3. Archivo de datos centralizado con tipos TypeScript
  - [x] 3.1 Crear `src/data/types.ts` con interfaces: `Category`, `Photo`, `HeroData`, `SocialLink`, `AboutData`, `SiteData`
  - [x] 3.2 Crear `src/data/siteData.ts` que exporte `siteData: SiteData` con datos mock: Hero (nombre, subtítulo, URL Unsplash), 4 categorías, 12+ fotos de Unsplash, bio placeholder, Instagram. Verificar que TypeScript compila sin errores y que las fotos referencian categorías existentes

- [x] 4. Componente Navbar con scroll suave y detección de sección activa
  - [x] 4.1 Crear `src/components/Navbar.tsx` con posición sticky/fixed en la parte superior, implementar enlaces a secciones (Hero, Galería, About) con `scrollIntoView({ behavior: 'smooth' })`
  - [x] 4.2 Implementar detección de sección activa con `IntersectionObserver` y resaltado visual del enlace activo
  - [x] 4.3 Implementar versión mobile (<768px): menú hamburguesa compacto, estilizar con colores de la paleta activa vía variables CSS (sin colores hardcodeados)

- [x] 5. Componente HeroSection
  - [x] 5.1 Crear `src/components/HeroSection.tsx` que ocupe 100vw × 100vh, renderizar imagen de fondo con `object-fit: cover` desde `siteData.hero.backgroundUrl`
  - [x] 5.2 Superponer nombre y subtítulo centrados con tipografía grande, implementar fallback: si la imagen falla (`onError`), mostrar fondo oscuro de la paleta con textos visibles, usar colores de la paleta activa para textos y overlays

- [x] 6. Componente GallerySection con filtros por categoría
  - [x] 6.1 Crear `src/components/GallerySection.tsx` con estado local `activeCategory` (default: `'all'`), crear `src/components/CategoryFilter.tsx` que renderice botón "Todas" + botones por cada categoría
  - [x] 6.2 Crear `src/components/PhotoGrid.tsx` con grid responsivo: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, crear `src/components/PhotoCard.tsx` con imagen que preserve proporción
  - [x] 6.3 Filtrar fotos por categoría activa; si no hay fotos mostrar mensaje "No hay fotografías en esta categoría". Al hacer clic en una foto, llamar callback para abrir el Lightbox

- [x] 7. Componente Lightbox con navegación por teclado
  - [x] 7.1 Crear `src/components/Lightbox.tsx` como modal fullscreen con backdrop oscuro semi-transparente, mostrar imagen centrada escalada con `object-fit: contain` y max-width/max-height del viewport
  - [x] 7.2 Implementar navegación cíclica prev/next con botones visuales y flechas de teclado ← →, implementar cierre: botón ×, tecla Escape, clic fuera de la imagen
  - [x] 7.3 Bloquear scroll del body mientras está abierto (`overflow: hidden`)

- [x] 8. Componente AboutSection con redes sociales
  - [x] 8.1 Crear `src/components/AboutSection.tsx` que muestre biografía desde `siteData.about.bio`, si la bio está vacía u undefined, ocultar el bloque sin espacios residuales
  - [x] 8.2 Crear `src/components/SocialLinks.tsx` que mapee `siteData.about.socialLinks` con `target="_blank" rel="noopener noreferrer"`, estilizar con colores de la paleta activa

- [x] 9. Integración en App.tsx y composición final
  - [ ] 9.1 Crear `src/App.tsx` que renderice: Navbar, HeroSection, GallerySection, AboutSection, Lightbox. Gestionar estado global del Lightbox en App (isOpen, currentPhotoIndex, photosArray)
  - [ ] 9.2 Agregar `id` a cada sección para scroll del Navbar y `scroll-margin-top` para compensar navbar fija
  - [ ] 9.3 Verificar que `npm run build` compila sin errores TypeScript y que todas las secciones se ven correctamente con la paleta Dark Classic

## Task Dependency Graph

```json
{
  "waves": [
    [1],
    [2, 3],
    [4, 5, 6, 7, 8],
    [9]
  ]
}
```

## Notes

- **Prioridad visual**: El objetivo es tener una preview funcional rápidamente para validar estética con el cliente.
- **Fase 2 (futura)**: Conexión a base de datos, formulario de contacto, animaciones.
- **Paletas**: Se entregan las 4 opciones; Nico elige cuál activar comentando/descomentando.
- **Fotos placeholder**: Usamos URLs de Unsplash que se reemplazan después con fotos reales.
