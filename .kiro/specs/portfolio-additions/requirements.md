# Requirements Document

## Introduction

Este documento define los requerimientos para tres nuevas adiciones al portafolio web existente de Nicolás Restrepo, fotógrafo de viajes. El portafolio actual ya cuenta con: Hero, Galería filtrable con grid, Lightbox, Sección About, Navbar sticky, y un Sistema de Paletas de colores vía variables CSS. Todo el contenido se obtiene desde un archivo de datos centralizado TypeScript (`src/data/siteData.ts`).

Las tres adiciones son:
1. **Foto del fotógrafo** en la Sección About
2. **Sección de Contacto** con formulario visual (sin backend)
3. **Sección de Marcas** con carrusel marquee + grid de cards con lightbox por marca

Todas las adiciones deben integrarse con el sistema de paletas existente (sin colores hardcodeados), obtener sus datos desde el Archivo_de_Datos centralizado, y mantener el diseño responsivo.

## Glossary

- **Portafolio**: La aplicación web completa del fotógrafo Nicolás Restrepo
- **Archivo_de_Datos**: Archivo TypeScript centralizado (`src/data/siteData.ts`) que contiene todo el contenido del sitio, editable sin modificar componentes
- **Paleta**: Conjunto de variables CSS que define la combinación de colores activa del sitio
- **Sección_About**: Sección existente con biografía corta del fotógrafo y enlaces a redes sociales
- **Foto_Fotógrafo**: Imagen de retrato del fotógrafo mostrada en la Sección About
- **Sección_Contacto**: Nueva sección con un formulario visual para que visitantes envíen mensajes
- **Formulario_Contacto**: Formulario visual con campos nombre, email, mensaje y botón de envío
- **Sección_Marcas**: Nueva sección que presenta las marcas con las que el fotógrafo ha trabajado
- **Carrusel_Marquee**: Componente de desplazamiento horizontal automático e infinito que muestra logos de marcas
- **Grid_Marcas**: Disposición en cuadrícula de tarjetas de marca debajo del Carrusel_Marquee
- **Tarjeta_Marca**: Componente visual que muestra el logo, foto de portada y nombre de una marca
- **Marca**: Entidad que representa una marca/cliente con la que el fotógrafo ha trabajado, incluyendo logo, foto de portada y galería de fotos del proyecto
- **Lightbox_Marca**: Modal de pantalla completa que muestra la galería de fotos de un proyecto de marca específico

## Requirements

### Requerimiento 1: Foto del Fotógrafo en Sección About

**Historia de Usuario:** Como visitante, quiero ver una foto del fotógrafo junto a su biografía, para poner un rostro a la persona detrás del trabajo y generar mayor conexión personal.

#### Criterios de Aceptación

1. THE Sección_About SHALL mostrar la Foto_Fotógrafo obtenida desde el campo `photographerPhotoUrl` del Archivo_de_Datos
2. WHILE el viewport es mayor o igual a 768px, THE Sección_About SHALL mostrar la Foto_Fotógrafo posicionada al lado izquierdo de la biografía en un layout de dos columnas
3. WHILE el viewport es menor a 768px, THE Sección_About SHALL mostrar la Foto_Fotógrafo posicionada encima de la biografía en un layout de una columna
4. THE Foto_Fotógrafo SHALL renderizarse con proporción de aspecto preservada, sin distorsionar ni recortar la imagen, con un ancho máximo de 300px
5. IF el campo `photographerPhotoUrl` no está definido o está vacío en el Archivo_de_Datos, THEN THE Sección_About SHALL ocultar el espacio de la Foto_Fotógrafo sin mostrar espacios en blanco ni imágenes rotas, manteniendo la biografía con el layout de una columna centrada
6. IF la imagen de la Foto_Fotógrafo no puede cargarse (error de red o URL inválida), THEN THE Sección_About SHALL ocultar la imagen y mantener el layout sin espacios residuales

### Requerimiento 2: Sección de Contacto con Formulario Visual

**Historia de Usuario:** Como visitante, quiero encontrar un formulario de contacto en el portafolio, para poder comunicarme con el fotógrafo de forma directa.

#### Criterios de Aceptación

1. THE Sección_Contacto SHALL renderizarse como una sección visible en la página debajo de la Sección About, con un título "Contacto" obtenido desde el Archivo_de_Datos
2. THE Formulario_Contacto SHALL contener un campo de texto para nombre (label "Nombre"), un campo de email (label "Email"), un área de texto para mensaje (label "Mensaje"), y un botón de envío con texto "Enviar"
3. THE Formulario_Contacto SHALL aplicar los colores de la Paleta activa en todos los elementos del formulario (fondo, texto, bordes, botón) sin utilizar valores de color hardcodeados
4. WHILE el viewport es menor a 768px, THE Formulario_Contacto SHALL ocupar el ancho completo del contenedor con los campos apilados verticalmente
5. WHILE el viewport es mayor o igual a 768px, THE Formulario_Contacto SHALL mantener un ancho máximo centrado en la página que resulte visualmente proporcionado
6. WHEN el visitante hace clic en el botón "Enviar", THE Formulario_Contacto SHALL prevenir el envío del formulario (sin navegación ni recarga de página) dado que no existe backend conectado en esta fase
7. THE Formulario_Contacto SHALL marcar los campos nombre, email y mensaje como requeridos mediante el atributo HTML `required`
8. THE Sección_Contacto SHALL incluir un enlace de navegación en la barra de navegación (Navbar) con texto "Contacto" que realice scroll suave hacia la sección
9. IF el Archivo_de_Datos no contiene datos de la sección contacto, THEN THE Sección_Contacto SHALL renderizarse con textos por defecto (título: "Contacto", subtítulo vacío)

### Requerimiento 3: Sección de Marcas — Carrusel Marquee

**Historia de Usuario:** Como visitante, quiero ver un carrusel de logos de marcas desplazándose automáticamente, para percibir rápidamente la credibilidad y experiencia profesional del fotógrafo.

#### Criterios de Aceptación

1. THE Sección_Marcas SHALL incluir un Carrusel_Marquee en la parte superior de la sección que muestre los logos de todas las Marcas definidas en el Archivo_de_Datos
2. THE Carrusel_Marquee SHALL desplazarse horizontalmente de forma automática y continua de derecha a izquierda, sin intervención del usuario, creando un efecto de scroll infinito
3. THE Carrusel_Marquee SHALL duplicar internamente los logos para garantizar la continuidad visual del desplazamiento sin espacios vacíos ni saltos visibles
4. WHILE el Carrusel_Marquee está visible, THE Carrusel_Marquee SHALL aplicar los colores de la Paleta activa para el fondo y SHALL mostrar los logos con un tamaño uniforme de altura máxima de 48px preservando la proporción de cada logo
5. WHEN se agregan nuevas Marcas al Archivo_de_Datos, THE Carrusel_Marquee SHALL mostrar los logos adicionales sin modificar código de componentes
6. IF el Archivo_de_Datos no contiene Marcas o el array está vacío, THEN THE Sección_Marcas SHALL ocultarse completamente sin mostrar espacios en blanco

### Requerimiento 4: Sección de Marcas — Grid de Tarjetas

**Historia de Usuario:** Como visitante, quiero ver tarjetas de las marcas con las que el fotógrafo ha trabajado, para explorar el portafolio profesional organizado por proyecto/cliente.

#### Criterios de Aceptación

1. THE Grid_Marcas SHALL mostrar una Tarjeta_Marca por cada Marca definida en el Archivo_de_Datos, posicionadas debajo del Carrusel_Marquee
2. THE Tarjeta_Marca SHALL mostrar el logo de la Marca (tamaño pequeño, en la esquina superior o parte superior de la tarjeta), la foto de portada del proyecto como imagen principal de la tarjeta, y el nombre de la Marca como texto visible
3. THE Grid_Marcas SHALL adaptar el número de columnas según el viewport: una columna para anchos menores a 768px, dos columnas entre 768px y 1024px, y tres columnas para anchos mayores a 1024px
4. THE Tarjeta_Marca SHALL aplicar los colores de la Paleta activa para fondo, texto y bordes sin utilizar valores de color hardcodeados
5. WHEN el visitante hace clic en una Tarjeta_Marca, THE Portafolio SHALL abrir el Lightbox_Marca mostrando la primera foto del array `photos` de la Marca seleccionada
6. WHEN se agregan nuevas Marcas al Archivo_de_Datos, THE Grid_Marcas SHALL mostrar las tarjetas adicionales sin modificar código de componentes
7. THE Tarjeta_Marca SHALL preservar la proporción de aspecto de la foto de portada sin recortarla ni distorsionarla

### Requerimiento 5: Lightbox de Galería por Marca

**Historia de Usuario:** Como visitante, quiero explorar todas las fotos de un proyecto de marca en un lightbox dedicado, para apreciar el trabajo completo realizado para cada cliente.

#### Criterios de Aceptación

1. WHEN el visitante hace clic en una Tarjeta_Marca, THE Lightbox_Marca SHALL abrirse mostrando la primera foto del array `photos` de la Marca seleccionada, centrada en el viewport con fondo oscuro semi-transparente
2. WHILE el Lightbox_Marca está abierto, THE Lightbox_Marca SHALL mostrar controles para navegar a la foto anterior y siguiente dentro del array `photos` de la Marca, con navegación cíclica (al llegar a la última foto continúa desde la primera y viceversa)
3. WHILE el Lightbox_Marca está abierto, THE Lightbox_Marca SHALL mostrar el nombre de la Marca como título visible sobre la galería
4. WHEN el visitante presiona la tecla Escape, THE Lightbox_Marca SHALL cerrarse
5. WHEN el visitante hace clic fuera de la imagen ampliada, THE Lightbox_Marca SHALL cerrarse
6. WHEN el visitante presiona la tecla de flecha derecha, THE Lightbox_Marca SHALL navegar a la siguiente foto, y WHEN presiona la tecla de flecha izquierda, THE Lightbox_Marca SHALL navegar a la foto anterior
7. WHILE el Lightbox_Marca está abierto, THE Portafolio SHALL impedir el scroll de la página de fondo
8. WHILE el Lightbox_Marca está abierto, THE Lightbox_Marca SHALL mostrar un botón para cerrar el modal
9. IF la Marca tiene un array `photos` vacío, THEN THE Tarjeta_Marca SHALL desactivar la acción de clic y no abrir el Lightbox_Marca

### Requerimiento 6: Estructura de Datos de Marcas

**Historia de Usuario:** Como desarrollador, quiero que los datos de marcas estén centralizados en el archivo de datos con tipado TypeScript, para agregar nuevas marcas editando únicamente el archivo de datos sin modificar componentes.

#### Criterios de Aceptación

1. THE Archivo_de_Datos SHALL contener un array de Marcas donde cada Marca tiene: un identificador único (`id` de tipo string), un nombre (`name` de tipo string), una URL de logo (`logoUrl` de tipo string), una URL de foto de portada (`coverPhotoUrl` de tipo string), y un array de URLs de fotos del proyecto (`photos` de tipo string array)
2. THE Archivo_de_Datos SHALL exportar una interfaz TypeScript `Brand` que defina la estructura de datos de una Marca con los campos: `id`, `name`, `logoUrl`, `coverPhotoUrl`, `photos`
3. THE Archivo_de_Datos SHALL incluir el array de Marcas como propiedad `brands` dentro de la interfaz `SiteData` existente
4. THE Archivo_de_Datos SHALL validar mediante tipado TypeScript que cada Marca tiene todos los campos obligatorios (`id`, `name`, `logoUrl`, `coverPhotoUrl`, `photos`) definidos
5. WHEN un desarrollador agrega un nuevo objeto Marca al array `brands` en el Archivo_de_Datos, THE Portafolio SHALL renderizar la nueva marca en el Carrusel_Marquee y en el Grid_Marcas sin modificar código de componentes

### Requerimiento 7: Estructura de Datos de About Extendido y Contacto

**Historia de Usuario:** Como desarrollador, quiero que la foto del fotógrafo y los datos de contacto estén centralizados en el archivo de datos, para mantener la consistencia del patrón de datos centralizado del portafolio.

#### Criterios de Aceptación

1. THE Archivo_de_Datos SHALL incluir un campo `photographerPhotoUrl` de tipo string dentro de la interfaz `AboutData` existente, conteniendo la URL de la foto del fotógrafo
2. THE Archivo_de_Datos SHALL incluir una propiedad `contact` dentro de la interfaz `SiteData` con al menos un campo `title` de tipo string para el título de la sección de contacto
3. THE Archivo_de_Datos SHALL actualizar la interfaz `SiteData` para incluir las propiedades `brands` (tipo `Brand[]`) y `contact` como campos opcionales, permitiendo que el portafolio funcione correctamente cuando estas propiedades no están definidas
4. THE Archivo_de_Datos SHALL mantener compatibilidad con los componentes existentes (Hero, Galería, About, Navbar) al agregar las nuevas propiedades, sin requerir cambios en los componentes que no se ven afectados por las adiciones

### Requerimiento 8: Navegación Actualizada

**Historia de Usuario:** Como visitante, quiero encontrar enlaces a las nuevas secciones (Contacto, Marcas) en la barra de navegación, para acceder rápidamente a cualquier parte del portafolio.

#### Criterios de Aceptación

1. THE Portafolio SHALL incluir un enlace "Marcas" en la barra de navegación que realice scroll suave hacia la Sección_Marcas
2. THE Portafolio SHALL incluir un enlace "Contacto" en la barra de navegación que realice scroll suave hacia la Sección_Contacto
3. THE Portafolio SHALL renderizar las secciones en el siguiente orden vertical: Hero, Galería, Marcas, About, Contacto
4. WHILE el visitante hace scroll, THE Portafolio SHALL resaltar visualmente en la barra de navegación el enlace correspondiente a la sección actualmente visible, incluyendo las nuevas secciones Marcas y Contacto
5. IF la Sección_Marcas está oculta (sin datos de marcas), THEN THE Portafolio SHALL ocultar el enlace "Marcas" de la barra de navegación
