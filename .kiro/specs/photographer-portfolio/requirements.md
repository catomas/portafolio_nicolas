# Requirements Document

## Introduction

Portafolio web para Nicolás Restrepo, fotógrafo especializado en fotografía de viajes. El sitio presenta un diseño minimalista centrado en las fotografías, con fondo oscuro y tipografía limpia como elemento de branding (sin logo). La arquitectura visual se inspira en petermckinnon.com: directa, inmersiva y con protagonismo absoluto de la imagen.

El proyecto se divide en dos fases:
- **Fase 1 (Visual First)**: Frontend estático con datos mock (fotos de Unsplash, categorías en archivo TS, bio placeholder).
- **Fase 2 (futura)**: Conexión a base de datos para gestión dinámica de contenido.

Este documento cubre la Fase 1.

## Glossary

- **Portafolio**: La aplicación web completa del fotógrafo Nicolás Restrepo
- **Hero**: Sección principal de impacto al inicio de la página con fotografía destacada y nombre del fotógrafo
- **Galería**: Sección que muestra las fotografías en un grid filtrable por categorías
- **Lightbox**: Modal de pantalla completa que muestra una fotografía ampliada al hacer clic sobre ella
- **Categoría**: Clasificación temática de las fotografías (ej: paisajes, retratos, urbano), definida en un archivo de datos TypeScript
- **Archivo_de_Datos**: Archivo TypeScript que contiene las categorías, fotos y textos del portafolio, editable sin modificar componentes
- **Paleta**: Conjunto de variables CSS que define la combinación de colores del sitio
- **Sistema_de_Paletas**: Mecanismo que permite alternar entre paletas de colores mediante comentar/descomentar variables CSS
- **Sección_About**: Sección con biografía corta del fotógrafo y enlace a redes sociales
- **Grid**: Disposición visual de las fotografías en columnas responsivas

## Requirements

### Requerimiento 1: Hero de Impacto

**Historia de Usuario:** Como visitante, quiero ver una fotografía de impacto a pantalla completa con el nombre del fotógrafo al entrar al sitio, para recibir una primera impresión inmersiva y profesional.

#### Criterios de Aceptación

1. WHEN el visitante carga la página, THE Portafolio SHALL mostrar la sección Hero ocupando el 100% del ancho y 100% del alto del viewport con una fotografía de fondo que cubra toda la sección sin distorsionar la proporción original de la imagen
2. WHILE la sección Hero es visible, THE Portafolio SHALL mostrar el nombre "Nicolás Restrepo" superpuesto sobre la fotografía usando únicamente tipografía como branding, sin logo ni imagen de marca
3. WHILE la sección Hero es visible, THE Portafolio SHALL mostrar el subtítulo del fotógrafo obtenido desde el Archivo_de_Datos, superpuesto sobre la fotografía debajo del nombre
4. THE Hero SHALL obtener la fotografía de fondo y los textos (nombre, subtítulo) desde el Archivo_de_Datos
5. IF la fotografía de fondo del Hero no puede cargarse, THEN THE Portafolio SHALL mostrar la sección Hero con el fondo oscuro de la Paleta activa y los textos visibles

### Requerimiento 2: Galería Filtrable

**Historia de Usuario:** Como visitante, quiero explorar las fotografías organizadas por categorías en un grid visual, para navegar el trabajo del fotógrafo de forma intuitiva.

#### Criterios de Aceptación

1. THE Galería SHALL mostrar las fotografías en un Grid responsivo que se adapte al tamaño de pantalla del dispositivo
2. THE Galería SHALL mostrar controles de filtro que incluyan la opción "Todas" seguida de todas las Categorías definidas en el Archivo_de_Datos, con "Todas" seleccionada por defecto al cargar la página
3. WHEN el visitante selecciona una Categoría, THE Galería SHALL mostrar únicamente las fotografías que pertenecen a la Categoría seleccionada y SHALL indicar visualmente cuál filtro está activo mediante un estilo diferenciado en el control seleccionado
4. WHEN el visitante selecciona el filtro "Todas", THE Galería SHALL mostrar todas las fotografías sin distinción de Categoría
5. THE Galería SHALL cargar las fotografías y Categorías exclusivamente desde el Archivo_de_Datos
6. WHEN se agregan o eliminan Categorías en el Archivo_de_Datos, THE Galería SHALL reflejar los cambios sin modificar código de componentes
7. IF la Categoría seleccionada no contiene fotografías, THEN THE Galería SHALL mostrar un mensaje indicando que no hay fotografías disponibles en esa categoría

### Requerimiento 3: Lightbox

**Historia de Usuario:** Como visitante, quiero ampliar cualquier fotografía en pantalla completa al hacer clic sobre ella, para apreciar los detalles de la imagen.

#### Criterios de Aceptación

1. WHEN el visitante hace clic en una fotografía del Grid, THE Lightbox SHALL abrirse mostrando la fotografía seleccionada centrada en el viewport con fondo oscuro semi-transparente, escalada para ocupar el máximo espacio disponible sin recortar la imagen ni exceder los límites del viewport
2. WHILE el Lightbox está abierto, THE Portafolio SHALL mostrar controles para navegar a la fotografía anterior y siguiente según el orden de aparición en el Grid activo, y al llegar a la última fotografía la navegación SHALL continuar cíclicamente desde la primera (y viceversa)
3. WHILE el Lightbox está abierto, THE Portafolio SHALL mostrar un botón para cerrar el Lightbox
4. WHEN el visitante presiona la tecla Escape, THE Lightbox SHALL cerrarse y devolver la vista al Grid
5. WHEN el visitante hace clic fuera de la imagen ampliada, THE Lightbox SHALL cerrarse
6. WHEN el visitante presiona la tecla de flecha derecha, THE Lightbox SHALL navegar a la siguiente fotografía, y WHEN presiona la tecla de flecha izquierda, THE Lightbox SHALL navegar a la fotografía anterior
7. WHILE el Lightbox está abierto, THE Portafolio SHALL impedir el scroll de la página de fondo

### Requerimiento 4: Sección About

**Historia de Usuario:** Como visitante, quiero leer una breve descripción del fotógrafo y acceder a su red social, para conocer más sobre su trabajo y seguirlo.

#### Criterios de Aceptación

1. THE Sección_About SHALL mostrar la biografía del fotógrafo obtenida desde el Archivo_de_Datos, con una extensión máxima de 500 caracteres
2. THE Sección_About SHALL mostrar cada enlace de red social definido en el Archivo_de_Datos con el nombre de la red visible como texto del enlace, abriendo en una nueva pestaña del navegador
3. THE Sección_About SHALL obtener las URLs de redes sociales desde el Archivo_de_Datos
4. WHEN se agregan nuevas redes sociales al Archivo_de_Datos, THE Sección_About SHALL mostrar los enlaces adicionales sin modificar código de componentes
5. IF la biografía no está definida o está vacía en el Archivo_de_Datos, THEN THE Sección_About SHALL ocultar el área de biografía sin mostrar espacios en blanco ni errores visuales

### Requerimiento 5: Sistema de Paletas de Colores

**Historia de Usuario:** Como desarrollador, quiero poder alternar entre múltiples paletas de colores de forma sencilla, para explorar diferentes estilos visuales y ajustar la estética del portafolio.

#### Criterios de Aceptación

1. THE Sistema_de_Paletas SHALL definir cuatro paletas de colores mediante variables CSS: Dark Classic (fondo negro, texto claro), Warm Cream (tonos cálidos crema), Neutral Gray (gris con acento arena), y Clean White (blanco minimalista), donde cada paleta define como mínimo variables para: color de fondo principal, color de texto principal, color de acento y color de fondo secundario
2. THE Sistema_de_Paletas SHALL permitir alternar entre paletas comentando y descomentando bloques de variables CSS sin modificar componentes, donde cada paleta define exactamente el mismo conjunto de nombres de variables CSS
3. THE Portafolio SHALL utilizar la paleta Dark Classic como paleta activa por defecto
4. WHILE una Paleta está activa, THE Portafolio SHALL aplicar las variables de color de la Paleta activa en todas las secciones del sitio (Hero, Galería, About, Navegación) sin utilizar valores de color hardcodeados en los componentes
5. IF más de una paleta se encuentra descomentada simultáneamente en el archivo CSS, THEN THE Sistema_de_Paletas SHALL aplicar la última paleta definida en el archivo según las reglas de cascada CSS

### Requerimiento 6: Archivo de Datos Centralizado

**Historia de Usuario:** Como desarrollador, quiero que todo el contenido del sitio (fotos, categorías, textos, redes sociales) esté centralizado en un archivo TypeScript editable, para modificar el contenido sin tocar componentes.

#### Criterios de Aceptación

1. THE Archivo_de_Datos SHALL contener la definición de todas las Categorías de fotografías con tipado TypeScript, donde cada Categoría tiene un identificador único y un nombre para mostrar
2. THE Archivo_de_Datos SHALL contener la lista de fotografías con un identificador único por foto, URL (placeholders de Unsplash), título y Categoría asociada mediante referencia al identificador de Categoría
3. THE Archivo_de_Datos SHALL contener los textos del Hero (nombre, subtítulo, URL de foto de fondo)
4. THE Archivo_de_Datos SHALL contener la biografía del fotógrafo y las redes sociales, donde cada red social tiene un nombre de plataforma y una URL
5. THE Archivo_de_Datos SHALL exportar interfaces TypeScript que definan la estructura de cada tipo de dato (Categoría, Fotografía, Hero, About, Red Social)
6. THE Archivo_de_Datos SHALL validar que cada fotografía referencia una Categoría existente (integridad referencial por tipado)

### Requerimiento 7: Diseño Responsivo

**Historia de Usuario:** Como visitante, quiero que el portafolio se vea correctamente en cualquier dispositivo, para explorar las fotografías desde mi celular, tablet o computador.

#### Criterios de Aceptación

1. WHILE el viewport es menor a 768px, THE Portafolio SHALL adaptar el Grid de la Galería a una columna
2. WHILE el viewport está entre 768px y 1024px, THE Portafolio SHALL adaptar el Grid de la Galería a dos columnas
3. WHILE el viewport es mayor a 1024px, THE Portafolio SHALL adaptar el Grid de la Galería a tres columnas
4. THE Portafolio SHALL mantener la proporción original de las imágenes en todos los tamaños de viewport sin recortar ni distorsionar
5. WHILE el viewport es menor a 768px, THE Portafolio SHALL adaptar la barra de navegación a un formato compacto adecuado para dispositivos móviles

### Requerimiento 8: Navegación Fluida

**Historia de Usuario:** Como visitante, quiero navegar entre las secciones del portafolio de forma fluida y sin recargas, para tener una experiencia inmersiva.

#### Criterios de Aceptación

1. THE Portafolio SHALL presentar todas las secciones (Hero, Galería, About) en una única página con scroll vertical
2. THE Portafolio SHALL incluir una barra de navegación con enlaces identificables a cada sección (Hero, Galería, About)
3. WHEN el visitante hace clic en un enlace de navegación, THE Portafolio SHALL desplazarse suavemente hacia la sección correspondiente sin recargar la página, posicionando el inicio de la sección visible debajo de la barra de navegación fija
4. WHILE el visitante hace scroll, THE Portafolio SHALL mantener la barra de navegación visible en la parte superior de la pantalla con posición fija
5. WHILE el visitante hace scroll, THE Portafolio SHALL resaltar visualmente en la barra de navegación el enlace correspondiente a la sección actualmente visible en el viewport

### Requerimiento 9: Despliegue en Vercel

**Historia de Usuario:** Como desarrollador, quiero desplegar el portafolio en Vercel, para tener el sitio accesible públicamente con despliegue automático.

#### Criterios de Aceptación

1. THE Portafolio SHALL incluir un archivo de configuración vercel.json con una regla de rewrite que redirija todas las rutas (source: "(.*)") hacia /index.html para soportar navegación SPA del lado del cliente
2. THE Portafolio SHALL generar un build de producción mediante el comando de build de Vite que finalice con código de salida 0 y produzca un directorio dist/ conteniendo al menos un archivo index.html y los assets estáticos con nombres hasheados
3. IF el build de producción falla, THEN THE Portafolio SHALL reportar en la salida estándar de error el nombre del archivo y número de línea donde ocurrió el error de TypeScript o de compilación
4. WHEN el build de producción finaliza exitosamente, THE Portafolio SHALL generar archivos JavaScript y CSS minificados dentro del directorio dist/assets/
