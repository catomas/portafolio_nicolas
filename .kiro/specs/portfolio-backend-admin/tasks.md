

# Implementation Plan: Portfolio Backend + Admin (Fase 2)

## Overview

Este plan convierte el diseño de la Fase 2 en una serie de tareas de código incrementales para un agente de código. El orden es test-driven donde aplica: las funciones puras (validadores, `findMissingConfigVars`, `resolveDoc`, `loginThrottle`, seed idempotente) se implementan junto con su prueba de propiedad en fast-check. Cada tarea construye sobre las anteriores y termina cableando las piezas en el enrutamiento y los contextos, evitando código huérfano.

Stack existente reutilizado: React 19 + Vite + Tailwind v4 + TypeScript + Vitest + fast-check. Firebase, EmailJS y el enrutamiento se mockean en los tests. La suite de la Fase 1 debe seguir pasando al 100% (Req 14).

Convención de pruebas de propiedad: cada test se ejecuta con `fc.assert(fc.property(...), { numRuns: 100 })` como mínimo y se etiqueta con un comentario `// Feature: portfolio-backend-admin, Property N: <texto>`.

> **Notas fuera del alcance de código (no son tareas):** la creación del usuario Admin en la consola de Firebase Authentication (email/password) y la configuración de las reglas de seguridad de Firestore/Storage se realizan manualmente en la consola de Firebase; no se implementan por código en este plan.

## Tasks

- [x] 1. Preparar dependencias, variables de entorno y script de seed
  - Instalar dependencias de runtime: `firebase`, `react-router-dom`, `@emailjs/browser`.
  - Instalar devDependencias: `tsx`, `dotenv`.
  - Agregar el script npm `"seed": "tsx scripts/seed.ts"` en `package.json`.
  - Crear `.env.example` enumerando sin valores reales: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`.
  - Actualizar `src/vite-env.d.ts` para declarar los tipos de las variables `import.meta.env.VITE_*` nuevas.
  - _Requisitos: 1.5, 12.7_

- [x] 2. Extender el modelo de tipos y el Fallback_Estatico
  - [x] 2.1 Agregar tipos de estilo de galería y extensión aditiva de `SiteData`
    - En `src/data/types.ts` agregar `GalleryCorners = 'square' | 'rounded'` y `GalleryStyle { gap: number; corners: GalleryCorners }`.
    - Extender `SiteData` con `galleryStyle?: GalleryStyle` (y `brands?`, `contact?` si no existen aún) de forma **opcional** para no romper la Fase 1.
    - Conservar sin cambios los tipos existentes (`Category`, `PhotoSize`, `Photo`, `HeroData`, `SocialLink`, `Brand`, `ContactData`, `AboutData`).
    - _Requisitos: 14.5, 14.6, 11.1_

  - [x] 2.2 Añadir el valor por defecto de `galleryStyle` en el Fallback_Estatico
    - En `src/data/siteData.ts` añadir `galleryStyle: { gap: 16, corners: 'rounded' }`.
    - Verificar que `siteData` sigue siendo la fuente del Fallback_Estatico sin quitar campos existentes.
    - _Requisitos: 11.8, 14.7_

- [x] 3. Inicialización de Firebase con validación pura
  - [x] 3.1 Implementar `src/lib/firebase.ts` (Firebase_Init)
    - Exportar `findMissingConfigVars(env)` como función pura que devuelve los nombres de las 6 variables `VITE_FIREBASE_*` ausentes o vacías tras `trim`.
    - Construir `firebaseConfig` desde `import.meta.env.VITE_FIREBASE_*` con fallback `''`.
    - Registrar en consola un error nombrando cada variable faltante cuando `findMissingConfigVars` devuelva elementos.
    - Inicialización idempotente con `getApps().length ? getApp() : initializeApp(...)`; exportar singletons `auth`, `db`, `storage`.
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.6_

  - [ ]* 3.2 Escribir prueba de propiedad para `findMissingConfigVars`
    - **Property 1: Detección de configuración de Firebase faltante**
    - **Validates: Requirements 1.6**
    - Generar máscaras de presencia/valor-vacío/ausencia sobre las 6 variables; verificar que el conjunto reportado es exactamente el de las ausentes/vacías.
    - Archivo: `src/lib/__tests__/firebase.test.ts` (mockear los módulos `firebase/*` para aislar la función pura).

- [x] 4. Validadores puros y sus pruebas de propiedad
  - [x] 4.1 Implementar `src/lib/validation.ts`
    - Definir `ValidationResult = { ok: true } | { ok: false; field: string; message: string }`.
    - `validatePhotoInput(input, existingCategoryIds)`: exige archivo, título recortado 1–100, `categoryId` en el conjunto existente (Req 5.2/5.3).
    - `validateCategory(cat, existingCats, editingId?)`: `id` recortado 1–50 y único, `name` recortado 1–60 (Req 6.3/6.4).
    - `validateImageFile(file)`: tipo `image/jpeg|png|webp` y tamaño ≤ 5 MB (Req 7.2/7.3).
    - `validateContactContent(title, subtitle)`: rechaza vacíos o solo-espacios; `title` ≤100, `subtitle` ≤300 (Req 10.1/10.3).
    - `validateGalleryStyle(style)`: `gap` entero en `[0, 64]`, `corners ∈ {'square','rounded'}` (Req 11.4).
    - `validateContactMessage(name, email, message)`: `name` 1–100, `message` 1–2000, email con `@`, ≥1 char antes y dominio con ≥1 punto después (Req 12.2/12.3).
    - _Requisitos: 5.2, 5.3, 6.3, 6.4, 7.2, 7.3, 10.3, 11.4, 12.2, 12.3_

  - [ ]* 4.2 Escribir prueba de propiedad para `validatePhotoInput`
    - **Property 2: Validación de creación de foto e integridad referencial**
    - **Validates: Requirements 5.2, 5.3**
    - Archivo: `src/lib/__tests__/validation.test.ts`.

  - [ ]* 4.3 Escribir prueba de propiedad para `validateCategory`
    - **Property 3: Validación y unicidad de categorías**
    - **Validates: Requirements 6.3, 6.4**

  - [ ]* 4.4 Escribir prueba de propiedad para `validateImageFile`
    - **Property 4: Validación de archivo de imagen**
    - **Validates: Requirements 7.2, 7.3**

  - [ ]* 4.5 Escribir prueba de propiedad para `validateContactMessage`
    - **Property 7: Validación del formulario de contacto**
    - **Validates: Requirements 12.2, 12.3**

  - [ ]* 4.6 Escribir pruebas unitarias para `validateContactContent` y `validateGalleryStyle`
    - Casos borde: título/subtítulo solo-espacios, `gap` en límites 0 y 64 y fuera de rango, `corners` inválido.
    - _Requisitos: 10.3, 11.4_

- [x] 5. Limitador de intentos de login (lógica pura)
  - [x] 5.1 Implementar `src/lib/loginThrottle.ts`
    - `ThrottleState { failures: number[] }`; `registerFailure(state, now)` agrega timestamp; `isLocked(state, now, windowMs=300000, maxFailures=5)` devuelve `true` con ≥5 fallos dentro de la ventana.
    - _Requisitos: 2.10_

  - [ ]* 5.2 Escribir pruebas de propiedad/unitarias para `loginThrottle`
    - Verificar que 5 fallos dentro de 5 min bloquean y que fallos fuera de la ventana no cuentan.
    - Archivo: `src/lib/__tests__/loginThrottle.test.ts`.
    - _Requisitos: 2.10_

- [x] 6. Hooks de lectura reactiva con fallback
  - [x] 6.1 Implementar `resolveDoc` y `src/hooks/useFirestoreDoc.ts`
    - Extraer `resolveDoc(snapshotData, isEmpty, getFallback)` pura: devuelve `getFallback()` cuando el dato es inexistente o `isEmpty(dato)`, en caso contrario el dato.
    - Hook `useFirestoreDoc({ path, getFallback, isEmpty })` con `onSnapshot(doc(db, path))`; expone `{ data, loading }`; ante error posterior conserva el último dato válido; ante fallo inicial aplica fallback.
    - _Requisitos: 4.1, 4.3, 4.4, 4.6, 4.7_

  - [ ]* 6.2 Escribir prueba de propiedad para `resolveDoc`
    - **Property 5: Fallback determinista de useFirestoreDoc**
    - **Validates: Requirements 4.3, 4.6**
    - Archivo: `src/hooks/__tests__/useFirestoreDoc.test.ts`.

  - [ ]* 6.3 Escribir pruebas unitarias del hook `useFirestoreDoc`
    - Snapshot válido seguido de error conserva el último valor (Req 4.7); `loading` inicial es `true`.
    - _Requisitos: 4.5, 4.7_

  - [x] 6.4 Implementar `src/hooks/usePhotos.ts` y `src/hooks/useBrands.ts`
    - `onSnapshot(collection(db, 'photos'))` / `'brands'`, mapeando `{ id: doc.id, ...doc.data() }`.
    - Aplicar fallback a `siteData.photos` / `siteData.brands` cuando la colección esté vacía/inexistente/fallida.
    - _Requisitos: 4.1, 4.3, 5.1, 9.7_

  - [ ]* 6.5 Escribir pruebas unitarias de `usePhotos` y `useBrands`
    - Colección vacía → fallback; documentos presentes → `id = doc.id`.
    - _Requisitos: 4.3, 9.7_

- [x] 7. Contexto de autenticación
  - [x] 7.1 Implementar `src/contexts/AuthContext.tsx`
    - `AuthProvider` con `onAuthStateChanged`; `{ user, loading }` (`loading=true` hasta la primera emisión).
    - `login(email, password)` → `signInWithEmailAndPassword`; `logout()` → `signOut`; sin `signUp`.
    - Hook `useAuth()` que lanza error fuera del provider.
    - _Requisitos: 2.1, 2.2, 2.4, 2.6, 2.7, 2.8_

  - [ ]* 7.2 Escribir pruebas unitarias de `AuthContext`
    - `login` con error propaga sin fijar `user`; `logout` limpia sesión; `useAuth` fuera del provider lanza.
    - _Requisitos: 2.2, 2.4, 2.7_

- [x] 8. Guard de rutas protegidas
  - [x] 8.1 Implementar `src/components/ProtectedRoute.tsx`
    - `loading` → spinner; `!user` → `<Navigate to="/admin/login" replace />`; `user` → children.
    - _Requisitos: 3.2, 3.3, 3.4_

  - [ ]* 8.2 Escribir prueba de propiedad para `ProtectedRoute`
    - **Property 6: Guard de rutas del panel sin sesión**
    - **Validates: Requirements 3.2, 3.3, 3.4**
    - Generar `{ loading, user }` y verificar spinner/redirect/children (mockear `useAuth` y `Navigate`).
    - Archivo: `src/components/__tests__/ProtectedRoute.test.tsx`.

- [x] 9. Página de login
  - [x] 9.1 Implementar `src/pages/LoginPage.tsx`
    - Formulario email/password; deshabilita el botón mientras el login está en curso (Req 2.9).
    - Credenciales inválidas → mensaje de error, permanece en `/admin/login`, conserva el email (Req 2.3).
    - Si ya hay `user`, `Navigate` a `/admin` (Req 3.5).
    - Integrar `loginThrottle`: tras 5 intentos fallidos en 5 min bloquear envíos y mostrar mensaje de bloqueo (Req 2.10).
    - _Requisitos: 2.3, 2.9, 2.10, 3.5_

  - [ ]* 9.2 Escribir pruebas unitarias de `LoginPage`
    - Login inválido conserva email y no navega; bloqueo tras 5 fallos deshabilita el envío.
    - _Requisitos: 2.3, 2.10_

- [x] 10. Contexto de datos del sitio público
  - [x] 10.1 Implementar `src/contexts/SiteDataContext.tsx`
    - Componer `useFirestoreDoc` (hero `site-content/hero`, about `profile/main`, contact `site-content/contact`, categories `site-config/categories`, gallery-style `site-config/gallery-style`) + `usePhotos` + `useBrands`.
    - Loading global = disyunción de los `loading` individuales; mientras carga, mostrar spinner en lugar de contenido parcial/fallback.
    - `useSiteData()` expone contenido garantizado (nunca `undefined`).
    - _Requisitos: 4.5, 4.6, 11.7, 11.8_

  - [ ]* 10.2 Escribir pruebas unitarias de `SiteDataContext`
    - Loading global `true` hasta la primera respuesta de todos los orígenes; resuelto aplica fallback solo a orígenes vacíos.
    - _Requisitos: 4.5, 4.6_

- [x] 11. Capa de servicio de escritura (Admin_Service)
  - [x] 11.1 Implementar utilidades y subida en `src/lib/admin.ts`
    - `stripUndefined(obj)` pura que elimina campos `undefined`.
    - `uploadFile(file, path)` → `uploadBytes` + `getDownloadURL`.
    - _Requisitos: 5.2, 7.4, 8.3, 9.2_

  - [ ]* 11.2 Escribir pruebas unitarias de `stripUndefined` y orquestación de subida
    - `stripUndefined` elimina `undefined`; cuando `uploadFile` rechaza, no se invoca la escritura del documento.
    - Archivo: `src/lib/__tests__/admin.test.ts`.
    - _Requisitos: 7.8, 8.7, 9.6_

  - [x] 11.3 Implementar CRUD de fotos y marcas en `src/lib/admin.ts`
    - Fotos: `createPhoto` (`addDoc`), `updatePhoto`, `deletePhoto` sobre `doc(db,'photos',id)`; `size` por defecto `medium`.
    - Marcas: `createBrand` (`addDoc`), `updateBrand`, `deleteBrand` sobre `doc(db,'brands',id)`.
    - Orquestación subida→escritura: si `uploadFile` falla, no escribir el documento.
    - _Requisitos: 5.2, 5.4, 5.5, 5.6, 9.2, 9.4, 9.5, 9.6_

  - [x] 11.4 Implementar escritura de singletons en `src/lib/admin.ts`
    - `updateHero` (`site-content/hero`), `updateAbout` (`profile/main`), `updateContact` (`site-content/contact`), `updateCategories` (`site-config/categories` con forma `{ categories }`), `updateGalleryStyle` (`site-config/gallery-style`), todos con `setDoc` + `merge`.
    - _Requisitos: 6.2, 7.5, 8.5, 10.2, 11.3_

  - [ ]* 11.5 Escribir pruebas unitarias del CRUD y singletons
    - Foto sin `size` persiste `medium` (Req 5.4); `updateCategories` escribe la forma `{ categories }`; fallo de subida no escribe (Req 7.8/8.7/9.6).
    - _Requisitos: 5.4, 6.2, 7.8, 8.7, 9.6_

- [x] 12. Checkpoint - Verificar núcleo de lógica y datos
  - Asegurarse de que todas las pruebas pasan; si surgen dudas, preguntar al usuario.

- [x] 13. Enrutamiento y cableado de la aplicación
  - [x] 13.1 Configurar el enrutamiento en `src/main.tsx` y `src/App.tsx`
    - Envolver en `BrowserRouter` + `AuthProvider`.
    - Rutas: `/` → sitio público (con `PaletteProvider` + `SiteDataProvider`), `/admin/login` → `LoginPage`, `/admin/*` → `ProtectedRoute` → `AdminPage`.
    - El Panel_Admin se renderiza sin el layout del Sitio_Publico; el sitio público conserva su layout de la Fase 1 en `/`.
    - _Requisitos: 3.1, 3.6, 3.7_

  - [ ]* 13.2 Escribir pruebas de integración de enrutamiento
    - Admin autenticado en `/admin/login` redirige a `/admin` (Req 3.5); no autenticado en `/admin` redirige a `/admin/login`.
    - _Requisitos: 3.3, 3.5_

- [x] 14. Refactor de componentes públicos para consumir `useSiteData()`
  - [x] 14.1 Refactorizar secciones públicas a `useSiteData()`
    - `HeroSection` → `.hero`; `GallerySection` → `.categories` y `.photos`; `AboutSection` → `.about`; `ContactSection` → `.contact`.
    - `BrandsSection` → `.brands`; si está vacío, no renderiza la sección (Req 9.8).
    - Conservar `PaletteContext`, `PaletteSwitcher` y los contratos de props de la Fase 1.
    - _Requisitos: 9.7, 9.8, 14.1, 14.2_

  - [x] 14.2 Aplicar estilos configurables de galería en `PhotoGrid` y `PhotoCard`
    - `PhotoGrid` lee `galleryStyle.gap` y aplica `style={{ gap: `${gap}px` }}` (en vez de `gap-4`).
    - `PhotoCard` lee `galleryStyle.corners` y aplica `style={{ borderRadius: corners === 'rounded' ? '0.5rem' : '0' }}` (en vez de `rounded-lg`).
    - _Requisitos: 11.7, 11.8_

  - [ ]* 14.3 Actualizar/ajustar pruebas de la Fase 1 afectadas por el refactor
    - Envolver los componentes públicos en un `SiteDataProvider` de prueba o mock del contexto para conservar sus contratos de props.
    - Verificar que la suite de la Fase 1 pasa al 100% tras el refactor.
    - _Requisitos: 14.1, 14.3, 14.4_

- [x] 15. Formulario de contacto público con EmailJS
  - [x] 15.1 Refactorizar `src/components/ContactForm.tsx` (público)
    - Validar con `validateContactMessage` antes de enviar; si es inválido no invocar EmailJS y mostrar el campo inválido conservando datos (Req 12.3).
    - Enviar con `emailjs.send(SERVICE_ID, TEMPLATE_ID, params, PUBLIC_KEY)` usando `VITE_EMAILJS_*` (Req 12.1).
    - Deshabilitar botón mientras envía (Req 12.6); timeout de 30 s con `Promise.race`.
    - Éxito → mensaje de confirmación y limpiar campos (Req 12.4); fallo/timeout → mensaje de reintento, rehabilita botón, conserva datos (Req 12.5).
    - _Requisitos: 12.1, 12.3, 12.4, 12.5, 12.6_

  - [ ]* 15.2 Escribir pruebas unitarias del `ContactForm` público
    - Fallo/timeout de EmailJS conserva datos y rehabilita el botón; input inválido no invoca EmailJS.
    - (La validación pura ya está cubierta por la Property 7 en 4.5.)
    - _Requisitos: 12.3, 12.5_

- [x] 16. Panel de administración y formularios
  - [x] 16.1 Implementar `src/pages/AdminPage.tsx` (tabs)
    - Tabs: `fotos | categorias | hero | about | marcas | contacto | estilos-galeria`; estado de tab activo y feedback `success`/`error` con auto-dismiss.
    - Header con `user.email` y botón "Cerrar sesión" que llama a `logout()` y redirige a `/admin/login`.
    - _Requisitos: 2.4, 2.5, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1, 11.1_

  - [x] 16.2 Implementar `admin/PhotoForm` y `admin/PhotoList`
    - Listar fotos (título, categoría, tamaño); crear/editar/eliminar; selector de categoría solo entre existentes; `size` por defecto `medium`; validar con `validatePhotoInput`.
    - Mensaje de éxito al completar; error identificando operación/causa conservando el formulario.
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [x] 16.3 Implementar `admin/CategoriesEditor`
    - CRUD del arreglo de categorías con `validateCategory`; confirmación explícita al eliminar una categoría referenciada por fotos.
    - Mensajes de éxito/error.
    - _Requisitos: 6.1, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [x] 16.4 Implementar `admin/HeroForm`
    - Campos `name` (≤60), `subtitle` (≤120) y carga de imagen validada con `validateImageFile`; guardar con `updateHero`.
    - Si la subida falla no escribe `backgroundUrl` y muestra error; conserva valores al fallar.
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [x] 16.5 Implementar `admin/AboutForm`
    - `bio` (≤500 con contador restante), foto del fotógrafo validada, gestión de `socialLinks` con URL válida; guardar con `updateAbout`.
    - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 16.6 Implementar `admin/BrandForm` y `admin/BrandList`
    - CRUD de marcas con `name` (1–100) y logo validado; si la subida del logo falla no crea/actualiza la marca.
    - Mensajes de éxito/error.
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.9, 9.10_

  - [x] 16.7 Implementar `admin/ContactForm` (admin)
    - `title` (≤100), `subtitle` (≤300); validar con `validateContactContent` rechazando vacíos/solo-espacios sin escribir; guardar con `updateContact`.
    - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 16.8 Implementar `admin/GalleryStyleForm`
    - Control de `gap` (0–64) y selector de `corners` (rectas/redondeadas); validar con `validateGalleryStyle`; guardar con `updateGalleryStyle`.
    - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 16.9 Escribir pruebas unitarias de formularios admin (selección)
    - Contacto admin rechaza `title`/`subtitle` solo-espacios sin escribir (Req 10.3); eliminar categoría referenciada exige confirmación (Req 6.7); imagen inválida conserva la previa sin subir (Req 7.3).
    - _Requisitos: 6.7, 7.3, 10.3_

- [x] 17. Script de seed idempotente
  - [x] 17.1 Implementar `scripts/seed.ts`
    - Cargar `.env` con `import 'dotenv/config'`; construir `firebaseConfig` desde `process.env`.
    - Escribir singletons con `setDoc` (hero, profile/main, categories, contact, gallery-style) y colecciones `photos`/`brands` con IDs deterministas: `setDoc(doc(collection(db,'photos'), photo.id), {...})`.
    - Usar las URLs de Unsplash de `siteData.ts` sin subir a Storage.
    - Registrar resumen (cantidad de singletons y de documentos por colección) al terminar; ante error de escritura registrar el documento/colección afectado, continuar y finalizar indicando fallo.
    - _Requisitos: 13.1, 13.2, 13.3, 13.4, 13.5, 13.7_

  - [ ]* 17.2 Escribir prueba de propiedad de idempotencia del seed
    - **Property 8: Idempotencia del script de seed**
    - **Validates: Requirements 13.6**
    - Con un Firestore en memoria (mock por ruta/ID), correr el seed 1x vs 2x y verificar el mismo conjunto de documentos (mismos IDs, sin duplicados) y contenido de singletons.
    - Archivo: `scripts/__tests__/seed.test.ts`.

  - [ ]* 17.3 Escribir prueba unitaria de manejo de error del seed
    - Una escritura que falla no detiene las demás y el resultado indica fallo (Req 13.7).
    - _Requisitos: 13.7_

- [x] 18. Checkpoint final - Verificación completa
  - Ejecutar `npx tsc -b` (typecheck), `npm test` (vitest --run) y `npm run build`; asegurarse de que la suite de la Fase 1 pasa al 100% y no hay errores de compilación ni de build. Si surgen dudas, preguntar al usuario.
  - _Requisitos: 14.3, 14.4, 14.6_

- [x] 19. Editor Visual de Galería con reordenamiento y vista previa
  - [x] 19.1 Instalar dependencias de drag & drop
    - Instalar como dependencias de runtime: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
    - Verificar que quedan registradas en `package.json`.
    - _Requisitos: 15.6_

  - [x] 19.2 Extender el tipo `Photo` con campos de orden y sembrar el orden en el Fallback_Estatico
    - En `src/data/types.ts` extender `Photo` de forma **aditiva** con `order?: number` (posición en el orden global) y `categoryOrder?: number` (posición dentro de su categoría), ambos opcionales y retrocompatibles con la Fase 1.
    - En `src/data/siteData.ts` asignar a cada Foto del Fallback_Estatico un `order` (índice global) y un `categoryOrder` (índice dentro de su categoría), dejando un orden inicial estable.
    - _Requisitos: 14.6, 15.13, 5.10_

  - [x] 19.3 Implementar el ordenamiento puro de Fotos `src/lib/photoOrder.ts`
    - `sortPhotosByOrder(photos, mode: 'global' | 'category')`: devuelve una **permutación** ordenada ascendentemente por `order` (modo `global`) o `categoryOrder` (modo `category`).
    - Las Fotos sin el campo de orden correspondiente se ubican al final de forma determinista y estable (desempate por el índice original en la entrada). No muta la entrada.
    - _Requisitos: 15.11, 15.12, 15.13_

  - [ ]* 19.4 Escribir prueba de propiedad para `sortPhotosByOrder`
    - **Property 9: Ordenamiento determinista del sitio público**
    - **Validates: Requirements 15.11, 15.12, 15.13**
    - Generar listas de Fotos (con/sin `order`/`categoryOrder`) y un modo; verificar permutación, orden ascendente por el campo del modo y Fotos sin orden al final de forma estable.
    - Con fast-check (≥100 iteraciones) y etiqueta `// Feature: portfolio-backend-admin, Property 9: ...`.
    - Archivo: `src/lib/__tests__/photoOrder.test.ts`.
    - _Requisitos: 15.11, 15.12, 15.13_

  - [x] 19.5 Extender `src/lib/admin.ts` con reordenamiento y orden al crear/editar Fotos
    - `reorderPhotosGlobal(orderedIds: string[])`: asigna `order = índice` (0..n-1) a cada Foto usando `writeBatch(db)` para atomicidad.
    - `reorderPhotosInCategory(categoryId, orderedIds)`: asigna `categoryOrder = índice` (0..n-1) a las Fotos de esa categoría usando `writeBatch(db)`.
    - Ajustar `createPhoto` para asignar `order`/`categoryOrder` al final (append) del orden existente al crear.
    - Ajustar `updatePhoto` para reasignar `categoryOrder` al final de la categoría destino cuando cambia el `categoryId`.
    - _Requisitos: 15.7, 15.8, 5.10, 5.11_

  - [ ]* 19.6 Escribir prueba de propiedad para el reordenamiento de Fotos
    - **Property 10: Reasignación de índices de orden en el reorden**
    - **Validates: Requirements 15.7, 15.8**
    - Generar arreglos de ids ordenados; verificar que la posición i recibe `order`/`categoryOrder` = i (0..n-1 contiguos y únicos, preservando el orden de entrada).
    - Con fast-check (≥100 iteraciones) y etiqueta `// Feature: portfolio-backend-admin, Property 10: ...`.
    - Archivo: `src/lib/__tests__/admin.test.ts` (o el archivo de pruebas de `admin.ts`).
    - _Requisitos: 15.7, 15.8_

  - [x] 19.7 Definir `PHOTO_SIZE_META` y usarlo en el selector de tamaño
    - Definir un mapa `PHOTO_SIZE_META: Record<PhotoSize, { label: string; grid: string }>` con etiquetas descriptivas y ayuda visual: `small` → "Pequeña (1×1)", `medium` → "Mediana (vertical 1×2)", `large` → "Grande (2×2 destacada)", `wide` → "Panorámica (2×1)".
    - Usarlo en el selector de tamaño (en `PhotoForm` y/o `GalleryEditor`) para mostrar la etiqueta legible y un mini-diagrama de cómo ocupa el grid.
    - _Requisitos: 5.4_

  - [x] 19.8 Implementar `src/components/admin/GalleryEditor.tsx` (vista unificada)
    - Combinar en una pantalla: gestión de Fotos (reusar `PhotoForm`/`PhotoList`), controles del Estilo_Galeria (reusar `GalleryStyleForm`/controles) con estado local `localStyle`, y un Preview_Galeria en vivo que reusa `PhotoGrid`/`PhotoCard` aplicando el `gap`/`corners` del estado local (Req 15.1, 15.2, 15.3).
    - Filtro de Categorias en **solo lectura** (chips + "Todas") desde `useSiteData().categories`, sin acciones CRUD de categorías. Al filtrar por categoría el preview muestra sus Fotos por `categoryOrder`; en "Todas", por `order` global (Req 15.4, 15.5).
    - Drag & drop con `@dnd-kit` (`DndContext` + `SortableContext` + `useSortable`): en "Todas" reordena y llama a `reorderPhotosGlobal`; con una categoría seleccionada llama a `reorderPhotosInCategory`. Actualización optimista del preview; si la persistencia falla, mostrar error y revertir al último orden persistido (Req 15.6, 15.7, 15.8, 15.9, 15.10).
    - _Requisitos: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9, 15.10_

  - [ ]* 19.9 Escribir pruebas de ejemplo de `GalleryEditor`
    - El preview refleja el `gap`/`corners` locales sin guardar (Req 15.2, 15.3); el filtro es solo lectura sin CRUD de categorías (Req 15.4); reorden en "Todas" llama a `reorderPhotosGlobal` y con categoría llama a `reorderPhotosInCategory` (Req 15.7, 15.8); el fallo de persistencia revierte el preview (Req 15.10).
    - Mockear `@dnd-kit` o simular `onDragEnd` invocando el handler.
    - _Requisitos: 15.2, 15.3, 15.4, 15.7, 15.8, 15.10_

  - [x] 19.10 Integrar `GalleryEditor` en `AdminPage`
    - Fusionar las pestañas "fotos" y "estilos-galeria" en una única pestaña "Galería" que renderiza `GalleryEditor` (agregar la pestaña "Galería" y retirar las dos anteriores).
    - _Requisitos: 15.1_

  - [x] 19.11 Refactorizar el sitio público para respetar el orden
    - `GallerySection`/`PhotoGrid` deben ordenar las Fotos con `sortPhotosByOrder`: sin filtro de categoría, `mode: 'global'`; con una categoría seleccionada, `mode: 'category'`.
    - _Requisitos: 15.11, 15.12, 15.13_

  - [ ]* 19.12 Escribir prueba de ejemplo del orden en la galería pública
    - La galería pública ordena por `order`/`categoryOrder` y las Fotos sin orden quedan al final.
    - _Requisitos: 15.11, 15.12_

  - [x] 19.13 Ajustar `scripts/seed.ts` para sembrar el orden de las Fotos
    - Al sembrar cada Foto, asignar `order` (índice global) y `categoryOrder` (índice dentro de su categoría), dejando un orden inicial determinista en Firestore.
    - _Requisitos: 13.2, 15.13_

- [~] 20. Checkpoint final - Verificación del Editor de Galería
  - Ejecutar `npx tsc -b` (typecheck), `npm test` (vitest --run) y `npm run build`; asegurarse de que la suite de la Fase 1 sigue pasando al 100% y que las nuevas pruebas de propiedad (9 y 10) pasan. Si surgen dudas, preguntar al usuario.
  - _Requisitos: 14.3, 14.4_

## Notes

- Las tareas marcadas con `*` son opcionales (pruebas) y pueden omitirse para un MVP más rápido; las de implementación núcleo no lo son.
- Cada tarea referencia requisitos concretos para trazabilidad.
- Las 10 pruebas de propiedad usan fast-check con ≥100 iteraciones y la etiqueta `// Feature: portfolio-backend-admin, Property N: ...`.
- Los checkpoints (tareas 12, 18 y 20) validan de forma incremental.
- Notas fuera de código (no tareas): crear el usuario Admin en Firebase Authentication y configurar las reglas de seguridad de Firestore/Storage se hacen en la consola de Firebase.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2.1", "3.1", "4.1", "5.1"] },
    { "id": 1, "tasks": ["2.2", "3.2", "4.2", "4.3", "4.4", "4.5", "4.6", "5.2", "6.1", "11.1"] },
    { "id": 2, "tasks": ["6.2", "6.3", "6.4", "7.1", "8.1", "11.2", "11.3", "11.4"] },
    { "id": 3, "tasks": ["6.5", "7.2", "8.2", "9.1", "10.1", "11.5"] },
    { "id": 4, "tasks": ["9.2", "10.2", "13.1", "14.1", "14.2", "15.1", "17.1"] },
    { "id": 5, "tasks": ["13.2", "14.3", "15.2", "16.1", "17.2", "17.3"] },
    { "id": 6, "tasks": ["16.2", "16.3", "16.4", "16.5", "16.6", "16.7", "16.8"] },
    { "id": 7, "tasks": ["16.9"] },
    { "id": 8, "tasks": ["19.1", "19.2"] },
    { "id": 9, "tasks": ["19.3", "19.7", "19.13"] },
    { "id": 10, "tasks": ["19.4", "19.5", "19.11"] },
    { "id": 11, "tasks": ["19.6", "19.8", "19.12"] },
    { "id": 12, "tasks": ["19.9", "19.10"] }
  ]
}
```
