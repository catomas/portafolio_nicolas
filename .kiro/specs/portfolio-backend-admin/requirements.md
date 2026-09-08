# Requirements Document

## Introduction

Esta funcionalidad constituye la Fase 2 del portafolio del fotógrafo Nicolás Restrepo. La Fase 1 entregó un frontend estático en React + Vite + Tailwind v4 + TypeScript que lee su contenido desde el archivo `src/data/siteData.ts`. La Fase 2 agrega un backend sobre Firebase (Authentication, Cloud Firestore y Cloud Storage) y un Panel de Administración protegido, sin servidor propio ni Cloud Functions: toda la lógica reside en el cliente usando el SDK web modular de Firebase.

El objetivo es que Nicolás pueda gestionar el contenido del sitio (Hero, fotos, categorías, About, marcas, contacto y estilos de galería) desde un panel privado, mientras los visitantes ven el contenido leído desde Firestore en tiempo real. El sistema debe conservar plena compatibilidad con los componentes públicos de la Fase 1 y ofrecer un fallback a los datos estáticos de `siteData.ts` cuando Firestore no tenga contenido disponible. Se incluye además un script de seed que puebla Firestore con el contenido actual de `siteData.ts`, y un formulario de contacto funcional mediante EmailJS.

## Glossary

- **Sitio**: La aplicación web completa del portafolio (rutas públicas y de administración).
- **Sitio_Publico**: El conjunto de rutas y componentes visibles para cualquier visitante sin autenticación.
- **Panel_Admin**: La sección protegida de administración accesible solo tras autenticación exitosa.
- **Admin**: El usuario autenticado (Nicolás) con permisos para gestionar el contenido.
- **Visitante**: Cualquier usuario no autenticado que navega el Sitio_Publico.
- **Firebase_Init**: El módulo `src/lib/firebase.ts` que inicializa Firebase una sola vez y exporta los singletons `auth`, `db` y `storage`.
- **Auth_Service**: El servicio de Firebase Authentication configurado con proveedor email/password.
- **Firestore**: La base de datos Cloud Firestore que almacena el contenido del Sitio.
- **Storage**: El servicio Cloud Storage que almacena los archivos de imagen subidos por el Admin.
- **Admin_Service**: La capa de servicio `src/lib/admin.ts` que expone las operaciones CRUD y de subida de archivos contra Firestore y Storage.
- **Auth_Context**: El contexto `src/contexts/AuthContext.tsx` que expone el estado de autenticación y las funciones `login`, `logout` y el hook `useAuth`.
- **Protected_Route**: El componente `src/components/ProtectedRoute.tsx` que protege las rutas del Panel_Admin.
- **SiteData_Context**: El contexto `src/contexts/SiteDataContext.tsx` que precarga y provee el contenido del Sitio_Publico a los componentes.
- **useFirestoreDoc**: El hook genérico basado en `onSnapshot` que suscribe un documento de Firestore con datos de respaldo (`getFallback`) y detección de vacío (`isEmpty`).
- **Fallback_Estatico**: El contenido definido en `src/data/siteData.ts` usado como respaldo.
- **Documento_Singleton**: Documento único de Firestore que representa contenido único (por ejemplo `site-content/hero`, `profile/main`, `site-config/categories`, `site-config/gallery-style`, `site-content/contact`).
- **Coleccion_Multi_Documento**: Colección de Firestore que representa una lista de entidades (por ejemplo `photos`, `brands`).
- **Foto**: Entidad con estructura `Photo { id, url, title, categoryId, size?, order?, categoryOrder? }` donde `size` es `PhotoSize = 'small' | 'medium' | 'large' | 'wide'`, `order` es la posición en el orden global y `categoryOrder` es la posición dentro de su categoría.
- **Categoria**: Entidad con estructura `Category { id, name }`.
- **Hero**: Contenido de la cabecera con estructura `HeroData { name, subtitle, backgroundUrl }`.
- **About**: Contenido de la sección biográfica con estructura `AboutData { bio, photographerPhotoUrl?, socialLinks: SocialLink[] }`.
- **Marca**: Entidad con estructura `Brand { id, name, logoUrl, coverPhotoUrl, photos: string[] }`.
- **Contacto**: Contenido de la sección de contacto con estructura `ContactData { title, subtitle? }`.
- **Estilo_Galeria**: Configuración de presentación de la galería que incluye el espaciado (gap) entre fotos y el estilo de esquinas (rectas o redondeadas). Se edita en el Editor_Galeria junto con las fotos.
- **Editor_Galeria**: La vista del Panel_Admin que combina la gestión de Fotos y el Estilo_Galeria en una sola pantalla, mostrando un Preview_Galeria en vivo, permite reordenar fotos por arrastre y muestra las Categorias en modo solo lectura como agrupador/filtro.
- **Preview_Galeria**: La previsualización dentro del Editor_Galeria que renderiza el mosaico de Fotos aplicando el gap y las esquinas del Estilo_Galeria vigente, reflejando cómo se verá en el Sitio_Publico.
- **EmailJS_Service**: El servicio EmailJS usado para enviar el formulario de contacto, configurado mediante variables de entorno `VITE_EMAILJS_*`.
- **ContactForm**: El formulario de contacto del Sitio_Publico que recolecta nombre, email y mensaje del Visitante y los envía mediante EmailJS_Service.
- **Script_Seed**: El script que puebla Firestore con el contenido de `Fallback_Estatico`, ejecutable mediante un comando npm.

## Requirements

### Requisito 1: Inicialización de Firebase

**Historia de usuario:** Como desarrollador, quiero una inicialización única de Firebase que exporte los servicios como singletons, para que toda la aplicación comparta una sola instancia configurada desde variables de entorno.

#### Criterios de Aceptación

1. WHEN el módulo Firebase_Init se carga por primera vez y no existe una aplicación de Firebase previamente inicializada, THE Firebase_Init SHALL inicializar la aplicación de Firebase usando las variables de entorno `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID` y `VITE_FIREBASE_APP_ID`.
2. IF ya existe una aplicación de Firebase inicializada cuando el módulo Firebase_Init se vuelve a evaluar, THEN THE Firebase_Init SHALL reutilizar la aplicación existente sin crear una nueva instancia.
3. THE Firebase_Init SHALL exportar los singletons `auth`, `db` y `storage`.
4. WHEN un módulo importa `auth`, `db` o `storage` desde Firebase_Init, THE Firebase_Init SHALL devolver la misma instancia previamente inicializada durante toda la vida de la aplicación.
5. THE Sitio SHALL incluir un archivo `.env.example` que enumere las seis variables de entorno `VITE_FIREBASE_*` requeridas (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`) sin valores reales.
6. IF al menos una de las seis variables de entorno `VITE_FIREBASE_*` requeridas está ausente o es una cadena vacía en tiempo de arranque, THEN THE Firebase_Init SHALL registrar un mensaje de error que identifique por nombre cada variable ausente o vacía.

### Requisito 2: Autenticación del Administrador

**Historia de usuario:** Como Nicolás, quiero iniciar sesión con email y contraseña, para que solo yo pueda acceder al panel de administración.

#### Criterios de Aceptación

1. THE Auth_Service SHALL usar el proveedor de autenticación email/password de Firebase.
2. WHEN el Admin envía credenciales válidas en la página de login, THE Auth_Service SHALL autenticar la sesión y THE Sitio SHALL redirigir al Admin al panel de administración.
3. IF el Admin envía credenciales inválidas, THEN THE Sitio SHALL mostrar un mensaje de error que indique que las credenciales son incorrectas, THE Sitio SHALL permanecer en la página de login sin establecer una sesión autenticada, y THE Sitio SHALL conservar el email introducido en el campo correspondiente.
4. THE Sitio SHALL ofrecer una acción de cierre de sesión que finalice la sesión autenticada mediante Auth_Service.
5. WHEN el Admin ejecuta el cierre de sesión, THE Sitio SHALL redirigir al Admin a la página de login del panel.
6. THE Sitio SHALL NOT ofrecer registro público de nuevas cuentas.
7. THE Auth_Context SHALL exponer el estado de autenticación actual, las funciones `login` y `logout`, y el hook `useAuth` mediante `onAuthStateChanged`.
8. WHILE existe una sesión autenticada, THE Auth_Service SHALL conservar dicha sesión entre recargas de la página hasta que el Admin ejecute el cierre de sesión.
9. WHILE una operación de inicio de sesión está en curso, THE Sitio SHALL deshabilitar el botón de envío del formulario de login para evitar envíos duplicados.
10. IF el Admin acumula 5 intentos de inicio de sesión con credenciales inválidas consecutivos dentro de una ventana de 5 minutos, THEN THE Sitio SHALL bloquear nuevos intentos de inicio de sesión durante 5 minutos y THE Sitio SHALL mostrar un mensaje que indique el bloqueo temporal.

### Requisito 3: Enrutamiento y Protección de Rutas del Panel

**Historia de usuario:** Como Nicolás, quiero que las rutas de administración estén protegidas y separadas del sitio público, para que ningún visitante acceda al panel ni vea el layout público mezclado con el de administración.

#### Criterios de Aceptación

1. THE Sitio SHALL usar `react-router-dom` para separar las rutas públicas de las rutas del Panel_Admin.
2. WHILE el estado de autenticación está siendo determinado, THE Protected_Route SHALL mostrar un indicador de carga y THE Protected_Route SHALL NOT redirigir ni renderizar el contenido del Panel_Admin hasta que el estado de autenticación quede resuelto.
3. IF un Visitante no autenticado accede a una ruta bajo `/admin` distinta de `/admin/login`, THEN THE Protected_Route SHALL redirigir al Visitante a `/admin/login`.
4. WHEN un Admin autenticado accede a una ruta bajo `/admin`, THE Protected_Route SHALL renderizar el contenido del Panel_Admin solicitado.
5. IF un Admin autenticado accede a `/admin/login`, THEN THE Sitio SHALL redirigir al Admin a la ruta raíz del Panel_Admin.
6. THE Panel_Admin SHALL renderizarse sin el layout del Sitio_Publico.
7. THE Sitio_Publico SHALL renderizarse en la ruta raíz `/` conservando su layout de la Fase 1 y sin el layout del Panel_Admin.

### Requisito 4: Lectura Pública en Tiempo Real con Fallback

**Historia de usuario:** Como Visitante, quiero ver siempre contenido coherente y actualizado, para que el sitio nunca aparezca vacío aunque falte contenido en la base de datos.

#### Criterios de Aceptación

1. THE Sitio_Publico SHALL leer el contenido desde Firestore en tiempo real mediante `onSnapshot`.
2. WHEN el Admin guarda un cambio de contenido en Firestore, THE Sitio_Publico SHALL reflejar el cambio en la interfaz visible en un máximo de 5 segundos sin requerir recarga manual de la página.
3. IF un Documento_Singleton o Coleccion_Multi_Documento no existe, está vacío, o la lectura inicial falla, THEN THE useFirestoreDoc SHALL proveer el Fallback_Estatico correspondiente definido en `src/data/siteData.ts`.
4. THE useFirestoreDoc SHALL aceptar una función `getFallback` que provea los datos de respaldo y una función `isEmpty` que determine si el dato recibido debe considerarse vacío.
5. WHILE el SiteData_Context no ha recibido la primera respuesta de la suscripción `onSnapshot` para todos los documentos y colecciones requeridos, THE Sitio_Publico SHALL mostrar un indicador de carga en lugar de contenido parcial o de respaldo.
6. WHEN el SiteData_Context recibe la primera respuesta de la suscripción `onSnapshot` para todos los documentos y colecciones requeridos, THE Sitio_Publico SHALL renderizar el contenido resuelto, aplicando el Fallback_Estatico únicamente a los orígenes inexistentes, vacíos o fallidos.
7. IF una suscripción `onSnapshot` ya inicializada emite un error después de la lectura inicial, THEN THE useFirestoreDoc SHALL conservar el último contenido válido mostrado sin dejar la sección vacía.

### Requisito 5: Gestión CRUD de Fotos

**Historia de usuario:** Como Nicolás, quiero crear, editar y eliminar fotos de la galería, para que pueda mantener actualizado mi portafolio visual.

#### Criterios de Aceptación

1. THE Panel_Admin SHALL presentar una pestaña dedicada a la gestión de Fotos que liste las Fotos existentes con su título, categoría y tamaño.
2. WHEN el Admin crea una Foto proporcionando un archivo de imagen, un título no vacío de máximo 100 caracteres, una categoría existente y un tamaño, THE Admin_Service SHALL subir la imagen a Storage, obtener su URL de descarga y crear un documento en la Coleccion_Multi_Documento `photos` con los campos `url`, `title`, `categoryId` y `size`.
3. IF el Admin intenta crear una Foto sin archivo de imagen, sin título, con un título mayor a 100 caracteres, o sin una categoría existente seleccionada, THEN THE Panel_Admin SHALL rechazar la operación sin escribir en la Coleccion_Multi_Documento `photos` y mostrar un mensaje de error que identifique el campo faltante o inválido.
4. THE Panel_Admin SHALL permitir seleccionar el tamaño de la Foto entre los valores `small`, `medium`, `large` y `wide`, presentando para cada opción una etiqueta descriptiva y una ayuda visual que indique cómo ocupa el espacio en el mosaico, usando `medium` como valor por defecto cuando no se especifique.
5. WHEN el Admin edita una Foto existente, THE Admin_Service SHALL actualizar el documento correspondiente en la Coleccion_Multi_Documento `photos`.
6. WHEN el Admin elimina una Foto, THE Admin_Service SHALL eliminar el documento correspondiente de la Coleccion_Multi_Documento `photos`.
7. WHEN el Admin asigna una categoría a una Foto, THE Panel_Admin SHALL permitir seleccionar únicamente entre las Categorias existentes.
8. WHEN una operación CRUD de Foto finaliza con éxito, THE Panel_Admin SHALL mostrar un mensaje de confirmación de éxito.
9. IF una operación CRUD de Foto falla, THEN THE Panel_Admin SHALL mostrar un mensaje de error que identifique la operación fallida y su causa, y conservar el estado del formulario sin descartar los datos introducidos.
10. WHEN el Admin crea una Foto, THE Admin_Service SHALL asignarle un valor de `order` global y un valor de `categoryOrder` dentro de su categoría que la ubiquen al final del orden existente.
11. WHEN el Admin cambia la categoría de una Foto existente, THE Admin_Service SHALL reasignar su `categoryOrder` al final del orden de la categoría destino.
12. WHEN el Admin elimina una Foto, THE Panel_Admin SHALL conservar un orden contiguo y sin huecos observables en el orden global y en el orden de la categoría afectada.

### Requisito 6: Gestión CRUD de Categorías

**Historia de usuario:** Como Nicolás, quiero crear, editar y eliminar categorías, para que pueda organizar las fotos de la galería por temas.

#### Criterios de Aceptación

1. THE Panel_Admin SHALL presentar una pestaña dedicada a la gestión de Categorias.
2. THE Admin_Service SHALL almacenar las Categorias en el Documento_Singleton `site-config/categories` con la forma `{ categories: Category[] }`.
3. WHEN el Admin crea una Categoria proporcionando un `id` no vacío de entre 1 y 50 caracteres, único respecto a los `id` existentes en el arreglo, y un `name` no vacío de entre 1 y 60 caracteres, THE Admin_Service SHALL agregar la Categoria al arreglo del Documento_Singleton `site-config/categories`.
4. IF el Admin intenta crear o editar una Categoria con un `id` vacío o mayor a 50 caracteres, con un `name` vacío o mayor a 60 caracteres, o con un `id` duplicado respecto a otra entrada del arreglo, THEN THE Admin_Service SHALL rechazar la operación sin modificar el arreglo del Documento_Singleton `site-config/categories` y THE Panel_Admin SHALL mostrar un mensaje de error que indique la causa del rechazo.
5. WHEN el Admin edita una Categoria existente, THE Admin_Service SHALL actualizar la entrada correspondiente en el arreglo del Documento_Singleton `site-config/categories`.
6. WHEN el Admin elimina una Categoria, THE Admin_Service SHALL eliminar la entrada correspondiente del arreglo del Documento_Singleton `site-config/categories`.
7. IF el Admin intenta eliminar una Categoria referenciada por el campo `categoryId` de una o más Fotos existentes, THEN THE Panel_Admin SHALL solicitar una confirmación explícita antes de eliminarla y THE Admin_Service SHALL conservar el arreglo del Documento_Singleton `site-config/categories` sin cambios hasta que el Admin confirme.
8. WHEN una operación CRUD de Categoria finaliza con éxito, THE Panel_Admin SHALL mostrar un mensaje de confirmación de éxito.
9. IF una operación CRUD de Categoria falla, THEN THE Panel_Admin SHALL mostrar un mensaje de error que identifique la operación fallida y su causa.

### Requisito 7: Gestión del Hero

**Historia de usuario:** Como Nicolás, quiero editar el nombre, el subtítulo y la imagen de fondo del Hero, para que la cabecera del sitio refleje mi marca personal.

#### Criterios de Aceptación

1. THE Panel_Admin SHALL presentar una pestaña dedicada a la gestión del Hero con un campo de texto para `name` limitado a un máximo de 60 caracteres, un campo de texto para `subtitle` limitado a un máximo de 120 caracteres y un control de carga para la imagen de fondo.
2. WHEN el Admin selecciona un archivo de imagen de fondo del Hero, THE Panel_Admin SHALL aceptar únicamente archivos de tipo imagen (`image/jpeg`, `image/png`, `image/webp`) con un tamaño máximo de 5 MB.
3. IF el Admin selecciona un archivo de imagen de fondo del Hero cuyo tipo no es `image/jpeg`, `image/png` ni `image/webp`, o cuyo tamaño supera 5 MB, THEN THE Panel_Admin SHALL rechazar el archivo, mostrar un mensaje de error que indique el criterio de validación incumplido y conservar la imagen previamente seleccionada sin subirla a Storage.
4. WHEN el Admin sube una nueva imagen de fondo del Hero válida, THE Admin_Service SHALL subir la imagen a Storage, obtener su URL de descarga y guardarla en el campo `backgroundUrl`.
5. WHEN el Admin guarda los cambios del Hero, THE Admin_Service SHALL escribir los campos `name`, `subtitle` y `backgroundUrl` en el Documento_Singleton `site-content/hero` usando `setDoc` con `merge`.
6. WHEN el guardado del Hero finaliza con éxito, THE Panel_Admin SHALL mostrar un mensaje de confirmación de éxito.
7. IF el guardado del Hero falla, THEN THE Panel_Admin SHALL mostrar un mensaje de error que indique la causa del fallo y THE Panel_Admin SHALL conservar los valores introducidos por el Admin sin descartarlos.
8. IF la subida de la imagen de fondo del Hero a Storage falla, THEN THE Admin_Service SHALL NOT escribir el campo `backgroundUrl` en el Documento_Singleton `site-content/hero` y THE Panel_Admin SHALL mostrar un mensaje de error que indique que la subida de la imagen falló.

### Requisito 8: Gestión del About

**Historia de usuario:** Como Nicolás, quiero editar mi biografía, mi foto y mis redes sociales, para que los visitantes conozcan mi trabajo y puedan contactarme.

#### Criterios de Aceptación

1. THE Panel_Admin SHALL presentar una pestaña dedicada a la gestión del About con campos para `bio`, la foto del fotógrafo y los enlaces de redes sociales.
2. IF el Admin introduce una `bio` que excede 500 caracteres, THEN THE Panel_Admin SHALL impedir superar el límite y mostrar el conteo de caracteres restante.
3. WHEN el Admin sube una nueva foto del fotógrafo válida, THE Admin_Service SHALL subir la imagen a Storage, obtener su URL de descarga y guardarla en el campo `photographerPhotoUrl`.
4. WHEN el Admin agrega, edita o elimina un enlace de red social, THE Panel_Admin SHALL permitir gestionar cada `SocialLink` con los campos `platform` y `url`, validando que la `url` tenga un formato de URL válido.
5. WHEN el Admin guarda los cambios del About, THE Admin_Service SHALL escribir los campos `bio`, `photographerPhotoUrl` y `socialLinks` en el Documento_Singleton `profile/main` usando `setDoc` con `merge`.
6. WHEN el guardado del About finaliza con éxito, THE Panel_Admin SHALL mostrar un mensaje de confirmación de éxito.
7. IF el guardado del About falla o la subida de la foto del fotógrafo a Storage falla, THEN THE Panel_Admin SHALL mostrar un mensaje de error que identifique la causa y conservar los valores introducidos por el Admin sin descartarlos.

### Requisito 9: Gestión CRUD de Marcas

**Historia de usuario:** Como Nicolás, quiero crear, editar y eliminar marcas con su logo, para que el carrusel de marcas muestre los clientes con los que he trabajado.

#### Criterios de Aceptación

1. THE Panel_Admin SHALL presentar una pestaña dedicada a la gestión de Marcas que liste las Marcas existentes.
2. WHEN el Admin crea una Marca proporcionando un `name` no vacío de entre 1 y 100 caracteres y un archivo de logo válido, THE Admin_Service SHALL subir el logo a Storage, obtener su URL de descarga y crear un documento en la Coleccion_Multi_Documento `brands` con los campos `name` y `logoUrl`.
3. IF el Admin intenta crear una Marca sin `name` válido o sin archivo de logo, THEN THE Panel_Admin SHALL rechazar la operación sin escribir en la Coleccion_Multi_Documento `brands` y mostrar un mensaje de error que identifique el campo faltante.
4. WHEN el Admin edita una Marca existente, THE Admin_Service SHALL actualizar el documento correspondiente en la Coleccion_Multi_Documento `brands`.
5. WHEN el Admin elimina una Marca, THE Admin_Service SHALL eliminar el documento correspondiente de la Coleccion_Multi_Documento `brands`.
6. IF la subida del logo de una Marca a Storage falla, THEN THE Admin_Service SHALL NOT crear ni actualizar el documento de la Marca y THE Panel_Admin SHALL mostrar un mensaje de error, conservando el estado previo.
7. THE Sitio_Publico SHALL alimentar el carrusel de marcas (BrandMarquee) con las Marcas leídas desde Firestore.
8. IF no existe ninguna Marca, THEN THE Sitio_Publico SHALL ocultar el carrusel de marcas sin dejar un espacio vacío.
9. WHEN una operación CRUD de Marca finaliza con éxito, THE Panel_Admin SHALL mostrar un mensaje de confirmación de éxito.
10. IF una operación CRUD de Marca falla, THEN THE Panel_Admin SHALL mostrar un mensaje de error que identifique la operación fallida y su causa.

### Requisito 10: Gestión del Contacto

**Historia de usuario:** Como Nicolás, quiero editar el título y el subtítulo de la sección de contacto, para que el mensaje de invitación al contacto se ajuste a mi tono.

#### Criterios de Aceptación

1. THE Panel_Admin SHALL presentar una pestaña dedicada a la gestión del Contacto con un campo `title` limitado a un máximo de 100 caracteres y un campo `subtitle` limitado a un máximo de 300 caracteres.
2. WHEN el Admin guarda los cambios del Contacto con los campos `title` y `subtitle` no vacíos, THE Admin_Service SHALL escribir los campos `title` y `subtitle` en el Documento_Singleton `site-content/contact` usando `setDoc` con `merge`.
3. IF el Admin intenta guardar el Contacto con el campo `title` o el campo `subtitle` vacío o compuesto únicamente por espacios en blanco, THEN THE Panel_Admin SHALL rechazar el guardado y mostrar un mensaje de error indicando cuál campo requerido falta, sin invocar la escritura en el Documento_Singleton `site-content/contact`.
4. WHEN el guardado del Contacto finaliza con éxito, THE Panel_Admin SHALL mostrar un mensaje de confirmación de éxito.
5. IF el guardado del Contacto falla, THEN THE Panel_Admin SHALL mostrar un mensaje de error descriptivo y conservar sin modificar el contenido previo del Documento_Singleton `site-content/contact`.

### Requisito 11: Estilos Configurables de Galería

**Historia de usuario:** Como Nicolás, quiero configurar el espaciado y el estilo de las esquinas de la galería, para que el mosaico luzca según mi preferencia estética.

#### Criterios de Aceptación

1. THE Panel_Admin SHALL presentar una pestaña dedicada al Estilo_Galeria con un control para el espaciado (gap) que acepte valores enteros entre 0 y 64 píxeles y un control para el estilo de esquinas.
2. THE Panel_Admin SHALL permitir seleccionar el estilo de esquinas entre exactamente dos valores: rectas y redondeadas.
3. WHEN el Admin guarda el Estilo_Galeria con un espaciado entre 0 y 64 píxeles y un estilo de esquinas válido, THE Admin_Service SHALL escribir la configuración de espaciado y esquinas en el Documento_Singleton `site-config/gallery-style` usando `setDoc` con `merge`.
4. IF el Admin intenta guardar el Estilo_Galeria con un espaciado fuera del rango de 0 a 64 píxeles o con un estilo de esquinas distinto de rectas o redondeadas, THEN THE Panel_Admin SHALL rechazar el guardado, mostrar un mensaje de error que indique el valor inválido y conservar la configuración previamente guardada sin modificarla.
5. WHEN el guardado del Estilo_Galeria finaliza con éxito, THE Panel_Admin SHALL mostrar un mensaje de confirmación de éxito.
6. IF el guardado del Estilo_Galeria falla, THEN THE Panel_Admin SHALL mostrar un mensaje de error descriptivo y conservar la configuración previamente guardada sin modificarla.
7. WHEN el Estilo_Galeria cambia en Firestore, THE Sitio_Publico SHALL aplicar el espaciado y el estilo de esquinas configurados a la galería sin requerir recarga manual de la página.
8. IF el Documento_Singleton `site-config/gallery-style` no existe o está vacío, THEN THE Sitio_Publico SHALL aplicar el Estilo_Galeria del Fallback_Estatico.

### Requisito 12: Formulario de Contacto Funcional con EmailJS

**Historia de usuario:** Como Visitante, quiero enviar un mensaje desde el formulario de contacto, para que pueda comunicarme con el fotógrafo sobre un proyecto.

#### Criterios de Aceptación

1. THE ContactForm SHALL enviar el mensaje mediante EmailJS_Service configurado con las variables de entorno `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID` y `VITE_EMAILJS_PUBLIC_KEY`.
2. WHEN el Visitante envía el formulario con un nombre de entre 1 y 100 caracteres no vacíos, un email que contenga un carácter `@` con al menos un carácter antes y un dominio con al menos un punto después, y un mensaje de entre 1 y 2000 caracteres no vacíos, THE ContactForm SHALL invocar a EmailJS_Service con los datos del formulario.
3. IF el Visitante envía el formulario con el nombre vacío, el mensaje vacío, un email que no cumpla el formato requerido, o cualquier campo que exceda su límite de caracteres (nombre 100, mensaje 2000), THEN THE ContactForm SHALL rechazar el envío, THE ContactForm SHALL NOT invocar a EmailJS_Service, y THE ContactForm SHALL mostrar un mensaje de error que identifique el campo inválido conservando los datos ingresados.
4. WHEN EmailJS_Service confirma el envío exitoso, THE ContactForm SHALL mostrar un mensaje de confirmación de éxito y limpiar los campos del formulario.
5. IF el envío mediante EmailJS_Service falla o no responde dentro de 30 segundos, THEN THE ContactForm SHALL mostrar un mensaje de error que indique al Visitante que intente nuevamente, THE ContactForm SHALL rehabilitar el botón de envío, y THE ContactForm SHALL conservar los datos ingresados en el formulario.
6. WHILE el envío del formulario está en curso, THE ContactForm SHALL deshabilitar el botón de envío para evitar envíos duplicados.
7. THE Sitio SHALL incluir en `.env.example` las variables de entorno `VITE_EMAILJS_*` requeridas sin valores reales.

### Requisito 13: Script de Seed de Firestore

**Historia de usuario:** Como Nicolás, quiero poblar la base de datos con el contenido actual del sitio mediante un comando, para que pueda empezar a administrar el sitio sin subir imágenes manualmente.

#### Criterios de Aceptación

1. THE Sitio SHALL exponer un comando npm que ejecute el Script_Seed.
2. WHEN el Script_Seed se ejecuta, THE Script_Seed SHALL poblar Firestore con el contenido de `Fallback_Estatico` (`src/data/siteData.ts`) incluyendo Hero, Categorias, Fotos, About, Marcas y Contacto, escribiendo todos los Documentos_Singleton y Colecciones_Multi_Documento definidos.
3. WHEN el Script_Seed finaliza el poblado sin errores de escritura, THE Script_Seed SHALL registrar un mensaje de éxito que indique la cantidad de Documentos_Singleton escritos y la cantidad de documentos creados en cada Coleccion_Multi_Documento (`photos`, `brands`).
4. THE Script_Seed SHALL usar las URLs de Unsplash existentes en `Fallback_Estatico` como valores de las imágenes, sin subir archivos a Storage.
5. THE Script_Seed SHALL escribir los Documentos_Singleton (`site-content/hero`, `profile/main`, `site-config/categories`, `site-content/contact`) y las Colecciones_Multi_Documento (`photos`, `brands`) según el modelo de datos definido.
6. WHEN el Script_Seed se ejecuta más de una vez, THE Script_Seed SHALL sobrescribir los Documentos_Singleton existentes y SHALL evitar crear documentos duplicados en las Colecciones_Multi_Documento `photos` y `brands` para el mismo contenido de `Fallback_Estatico`.
7. IF el Script_Seed encuentra un error de escritura, THEN THE Script_Seed SHALL registrar un mensaje de error que identifique el documento o colección afectado, THE Script_Seed SHALL continuar con las escrituras restantes, y THE Script_Seed SHALL finalizar indicando que la ejecución falló.

### Requisito 14: Compatibilidad con la Fase 1

**Historia de usuario:** Como desarrollador, quiero conservar los componentes y pruebas de la Fase 1, para que la incorporación del backend no rompa el sitio público existente.

#### Criterios de Aceptación

1. WHEN el Sitio_Publico se renderiza, THE Sitio SHALL montar los componentes públicos existentes (`HeroSection`, `GallerySection`, `Lightbox`, `AboutSection`, `BrandsSection`, `BrandMarquee`, `ContactSection` y `PaletteSwitcher`) sin errores en tiempo de ejecución, conservando el contrato de props y datos definido en la Fase 1.
2. THE Sitio SHALL conservar el `PaletteContext` y el selector de paletas (`PaletteSwitcher`) en el Sitio_Publico.
3. WHEN se ejecuta la suite de pruebas existente mediante `npm test`, THE Sitio SHALL hacer que el 100% de las pruebas existentes de la Fase 1 finalice con estado de aprobación.
4. IF al menos una prueba existente de la Fase 1 finaliza con estado de fallo tras la ejecución de `npm test`, THEN THE Sitio SHALL reportar el resultado como fallo de la suite indicando la o las pruebas afectadas.
5. THE Sitio SHALL conservar los tipos definidos en `src/data/types.ts` (`Category`, `PhotoSize`, `Photo`, `HeroData`, `SocialLink`, `Brand`, `ContactData`, `AboutData`, `SiteData`).
6. WHERE un tipo de `src/data/types.ts` requiere extensión para el Estilo_Galeria o para el orden de las Fotos (`order`, `categoryOrder`), THE Sitio SHALL agregar los nuevos campos como opcionales de forma que el código existente de la Fase 1 siga compilando sin modificaciones.
7. THE Sitio SHALL conservar `src/data/siteData.ts` como fuente del Fallback_Estatico.

### Requisito 15: Editor Visual de Galería con Reordenamiento y Vista Previa

**Historia de usuario:** Como Nicolás, quiero un editor visual que combine las fotos y el estilo de la galería con vista previa en vivo y reordenamiento por arrastre, para organizar mi portafolio y ver al instante cómo quedará en el sitio.

#### Criterios de Aceptación

1. THE Panel_Admin SHALL presentar un Editor_Galeria que muestre en una misma vista la gestión de Fotos, los controles del Estilo_Galeria y un Preview_Galeria en vivo.
2. THE Preview_Galeria SHALL renderizar el mosaico de Fotos aplicando el gap y el estilo de esquinas del Estilo_Galeria vigente en el Editor_Galeria.
3. WHEN el Admin modifica el gap o el estilo de esquinas en el Editor_Galeria, THE Preview_Galeria SHALL reflejar el cambio de inmediato sin requerir guardar ni recargar.
4. THE Editor_Galeria SHALL mostrar las Categorias en modo solo lectura como filtro/agrupador, sin exponer acciones de crear, editar o eliminar Categorias.
5. WHEN el Admin selecciona una Categoria en el filtro del Editor_Galeria, THE Preview_Galeria SHALL mostrar únicamente las Fotos de esa Categoria en su orden por categoría; y WHEN el Admin selecciona la opción de ver todas, THE Preview_Galeria SHALL mostrar todas las Fotos en el orden global.
6. THE Editor_Galeria SHALL permitir reordenar las Fotos mediante arrastrar y soltar.
7. WHILE el filtro está en "todas", WHEN el Admin reordena Fotos por arrastre, THE Admin_Service SHALL persistir el nuevo `order` global de las Fotos afectadas en la Coleccion_Multi_Documento `photos`.
8. WHILE hay una Categoria seleccionada en el filtro, WHEN el Admin reordena Fotos por arrastre, THE Admin_Service SHALL persistir el nuevo `categoryOrder` de las Fotos de esa Categoria en la Coleccion_Multi_Documento `photos`.
9. WHEN el Admin reordena Fotos, THE Panel_Admin SHALL reflejar el nuevo orden en el Preview_Galeria de inmediato.
10. IF la persistencia del nuevo orden falla, THEN THE Panel_Admin SHALL mostrar un mensaje de error y revertir el Preview_Galeria al último orden persistido.
11. WHEN el Sitio_Publico renderiza la galería sin filtro de categoría, THE Sitio_Publico SHALL ordenar las Fotos por su `order` global ascendente.
12. WHEN el Sitio_Publico renderiza las Fotos de una Categoria seleccionada, THE Sitio_Publico SHALL ordenar esas Fotos por su `categoryOrder` ascendente.
13. IF una Foto no tiene `order` o `categoryOrder` definido, THEN THE Sitio_Publico SHALL ubicarla de forma determinista al final del orden correspondiente sin romper el renderizado.
