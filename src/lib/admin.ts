/**
 * Admin_Service — capa de servicio de escritura contra Firestore y Storage.
 *
 * Esta capa NO valida: recibe datos ya validados por `src/lib/validation.ts`
 * y se encarga únicamente de persistirlos. Centraliza la limpieza de campos
 * `undefined` (Firestore los rechaza) y la orquestación subida→escritura.
 *
 * NOTA: este archivo se irá extendiendo con el CRUD de fotos/marcas (11.3) y
 * la escritura de singletons (11.4). Aquí solo viven las utilidades base y la
 * subida de archivos (11.1).
 */
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Función PURA: devuelve una copia del objeto eliminando los campos cuyo valor
 * es `undefined`. Firestore rechaza valores `undefined`, por lo que se limpian
 * antes de escribir. No muta el objeto de entrada.
 */
export function stripUndefined<T extends object>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    const value = obj[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Sube un archivo a Storage en la ruta indicada y devuelve su URL de descarga.
 * Si la subida falla, la promesa se rechaza y quien orquesta NO debe escribir
 * el documento asociado (Req 7.8, 8.7, 9.6).
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

// ---------------------------------------------------------------------------
// CRUD de Fotos y Marcas (11.3)
// ---------------------------------------------------------------------------
//
// Reglas de identidad (ver design.md):
// - El `id` de la entidad es `doc.id`; NO se persiste dentro del documento.
// - `createPhoto`/`createBrand` usan `addDoc` (ID autogenerado por Firestore).
// - `update*`/`delete*` operan sobre `doc(db, col, id)`.
//
// Orquestación subida→escritura (Req 5.2, 9.2, 9.6):
// - Cuando el input trae un `File`, primero se sube con `uploadFile`; si la
//   subida falla (rechaza), se propaga el error y NO se escribe el documento.
// - Alternativamente, el input puede traer una `url`/`logoUrl` ya subida.

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import type {
  PhotoSize,
  HeroData,
  AboutData,
  ContactData,
  Category,
  GalleryStyle,
} from '../data/types';
import { db } from './firebase';

/**
 * Entrada de servicio para crear una Foto.
 *
 * Provee la imagen de una de estas dos formas (respetando la orquestación
 * subida→escritura): un `file` a subir a Storage, o una `url` ya subida.
 */
export interface CreatePhotoInput {
  /** Archivo a subir a Storage. Si se provee, se sube antes de escribir. */
  file?: File;
  /** URL ya subida. Se usa si no se provee `file`. */
  url?: string;
  title: string;
  categoryId: string;
  /** Tamaño en el grid; por defecto `'medium'` cuando no se especifica. */
  size?: PhotoSize;
  /**
   * Posición en el orden global (0-based). El servicio no tiene acceso de
   * lectura a la lista actual de fotos, por lo que el llamador (GalleryEditor/
   * PhotoForm) lo calcula appendeando al final (p. ej. `order = photos.length`)
   * y lo pasa aquí. Si no se provee, no se persiste (Req 15.7, 5.10).
   */
  order?: number;
  /**
   * Posición dentro de su categoría (0-based). El llamador lo calcula como el
   * número de fotos ya existentes en esa categoría y lo pasa aquí. Si no se
   * provee, no se persiste (Req 15.8, 5.11).
   */
  categoryOrder?: number;
}

/** Entrada de servicio para actualizar una Foto (todos los campos opcionales). */
export interface UpdatePhotoInput {
  /** Archivo a subir a Storage. Si se provee, se sube antes de escribir. */
  file?: File;
  /** URL ya subida. Se usa si no se provee `file`. */
  url?: string;
  title?: string;
  categoryId?: string;
  size?: PhotoSize;
  /**
   * Posición dentro de la categoría destino (0-based). El servicio no tiene
   * acceso de lectura a la lista actual de fotos; cuando el `categoryId`
   * cambia respecto al actual, el llamador calcula el índice al final de la
   * categoría destino y lo pasa aquí para reasignarlo (Req 15.8, 5.11). Si no
   * se provee, no se persiste.
   */
  categoryOrder?: number;
}

/**
 * Crea una Foto en la colección `photos` (Req 5.2, 5.4).
 *
 * Si `input.file` está presente, primero sube el archivo a Storage; si la
 * subida falla, se propaga el error y no se escribe el documento. El `id` de
 * la entidad es `doc.id`, por lo que NO se guarda dentro del documento.
 * `size` toma `'medium'` por defecto cuando no se especifica.
 *
 * `order`/`categoryOrder` se persisten appendeando al final del orden
 * existente (Req 5.10, 5.11, 15.7, 15.8). Como esta capa no lee la lista actual
 * de fotos, el llamador calcula ambos índices (p. ej. `order = photos.length` y
 * `categoryOrder` = nº de fotos en esa categoría) y los pasa por el input. Si
 * no se proveen, no se escriben (retrocompatibilidad: se appendean luego).
 *
 * @returns el `id` (doc.id) de la foto creada.
 */
export async function createPhoto(input: CreatePhotoInput): Promise<string> {
  const url = input.file
    ? await uploadFile(input.file, `photos/${Date.now()}-${input.file.name}`)
    : input.url;

  const data = stripUndefined({
    url,
    title: input.title,
    categoryId: input.categoryId,
    size: input.size ?? 'medium',
    order: input.order,
    categoryOrder: input.categoryOrder,
  });

  const docRef = await addDoc(collection(db, 'photos'), data);
  return docRef.id;
}

/**
 * Actualiza una Foto existente en `photos` (Req 5.5).
 *
 * Si `input.file` está presente, primero sube el archivo a Storage; si la
 * subida falla, se propaga el error y no se escribe el documento.
 *
 * Cuando el `categoryId` cambia respecto al actual, la foto debe reubicarse al
 * final de la categoría destino (Req 5.11, 15.8). Como esta capa no lee el
 * estado actual, el llamador detecta el cambio de categoría y pasa el nuevo
 * `categoryOrder` (índice al final de la categoría destino) por el input; se
 * persiste vía `stripUndefined`. Si no se provee, no se toca.
 */
export async function updatePhoto(
  id: string,
  input: UpdatePhotoInput,
): Promise<void> {
  const uploadedUrl = input.file
    ? await uploadFile(input.file, `photos/${Date.now()}-${input.file.name}`)
    : undefined;

  const data = stripUndefined({
    url: uploadedUrl ?? input.url,
    title: input.title,
    categoryId: input.categoryId,
    size: input.size,
    categoryOrder: input.categoryOrder,
  });

  await updateDoc(doc(db, 'photos', id), data);
}

/** Elimina una Foto de `photos` por su `id` (Req 5.6). */
export async function deletePhoto(id: string): Promise<void> {
  await deleteDoc(doc(db, 'photos', id));
}

/**
 * Reordena las Fotos en el orden GLOBAL (Req 15.7).
 *
 * Recibe los ids en el nuevo orden y asigna `order = índice` (0..n-1) a cada
 * uno, de forma que la posición `i` del arreglo obtiene `order = i`. Usa
 * `writeBatch(db)` para que la reasignación sea atómica: o se aplican todas las
 * escrituras o ninguna.
 */
export async function reorderPhotosGlobal(
  orderedIds: string[],
): Promise<void> {
  const batch = writeBatch(db);
  orderedIds.forEach((id, i) => {
    batch.update(doc(db, 'photos', id), { order: i });
  });
  await batch.commit();
}

/**
 * Reordena las Fotos DENTRO de una categoría (Req 15.8).
 *
 * `categoryId` documenta la intención; `orderedIds` ya son las Fotos de esa
 * categoría en el nuevo orden. Asigna `categoryOrder = índice` (0..n-1) a cada
 * id, de modo que la posición `i` obtiene `categoryOrder = i`. Usa
 * `writeBatch(db)` para atomicidad.
 */
export async function reorderPhotosInCategory(
  categoryId: string,
  orderedIds: string[],
): Promise<void> {
  // `categoryId` documenta la intención; los ids ya corresponden a esa categoría.
  void categoryId;
  const batch = writeBatch(db);
  orderedIds.forEach((id, i) => {
    batch.update(doc(db, 'photos', id), { categoryOrder: i });
  });
  await batch.commit();
}

/**
 * Entrada de servicio para crear una Marca.
 *
 * El logo se provee como `logoFile` a subir a Storage o como `logoUrl` ya
 * subida (respetando la orquestación subida→escritura).
 */
export interface CreateBrandInput {
  name: string;
  /** Archivo de logo a subir a Storage. Si se provee, se sube antes de escribir. */
  logoFile?: File;
  /** URL de logo ya subida. Se usa si no se provee `logoFile`. */
  logoUrl?: string;
  /** URL de foto de portada del proyecto (opcional). */
  coverPhotoUrl?: string;
  /** URLs de fotos del proyecto. */
  photos?: string[];
}

/** Entrada de servicio para actualizar una Marca (todos los campos opcionales). */
export interface UpdateBrandInput {
  name?: string;
  /** Archivo de logo a subir a Storage. Si se provee, se sube antes de escribir. */
  logoFile?: File;
  /** URL de logo ya subida. Se usa si no se provee `logoFile`. */
  logoUrl?: string;
  coverPhotoUrl?: string;
  photos?: string[];
}

/**
 * Crea una Marca en la colección `brands` (Req 9.2).
 *
 * Si `input.logoFile` está presente, primero sube el logo a Storage; si la
 * subida falla, se propaga el error y no se escribe el documento (Req 9.6).
 * El `id` de la entidad es `doc.id`, por lo que NO se guarda en el documento.
 *
 * @returns el `id` (doc.id) de la marca creada.
 */
export async function createBrand(input: CreateBrandInput): Promise<string> {
  const logoUrl = input.logoFile
    ? await uploadFile(input.logoFile, `brands/${Date.now()}-${input.logoFile.name}`)
    : input.logoUrl;

  const data = stripUndefined({
    name: input.name,
    logoUrl,
    coverPhotoUrl: input.coverPhotoUrl,
    photos: input.photos,
  });

  const docRef = await addDoc(collection(db, 'brands'), data);
  return docRef.id;
}

/**
 * Actualiza una Marca existente en `brands` (Req 9.4).
 *
 * Si `input.logoFile` está presente, primero sube el logo a Storage; si la
 * subida falla, se propaga el error y no se escribe el documento (Req 9.6).
 */
export async function updateBrand(
  id: string,
  input: UpdateBrandInput,
): Promise<void> {
  const uploadedLogoUrl = input.logoFile
    ? await uploadFile(input.logoFile, `brands/${Date.now()}-${input.logoFile.name}`)
    : undefined;

  const data = stripUndefined({
    name: input.name,
    logoUrl: uploadedLogoUrl ?? input.logoUrl,
    coverPhotoUrl: input.coverPhotoUrl,
    photos: input.photos,
  });

  await updateDoc(doc(db, 'brands', id), data);
}

/** Elimina una Marca de `brands` por su `id` (Req 9.5). */
export async function deleteBrand(id: string): Promise<void> {
  await deleteDoc(doc(db, 'brands', id));
}

// ---------------------------------------------------------------------------
// Escritura de singletons (11.4)
// ---------------------------------------------------------------------------
//
// Documentos únicos (no colecciones) que representan secciones del sitio. Todos
// se escriben con `setDoc(..., { merge: true })` para no borrar campos ausentes
// y `stripUndefined` para eliminar valores `undefined` que Firestore rechaza.
// Esta capa NO valida: recibe datos ya validados por `src/lib/validation.ts`.

/** Actualiza el contenido del Hero en `site-content/hero` (Req 7.5). */
export async function updateHero(data: HeroData): Promise<void> {
  await setDoc(doc(db, 'site-content', 'hero'), stripUndefined(data), {
    merge: true,
  });
}

/** Actualiza el contenido de la sección About en `profile/main` (Req 8.5). */
export async function updateAbout(data: AboutData): Promise<void> {
  await setDoc(doc(db, 'profile', 'main'), stripUndefined(data), {
    merge: true,
  });
}

/** Actualiza el contenido de la sección de contacto en `site-content/contact` (Req 10.2). */
export async function updateContact(data: ContactData): Promise<void> {
  await setDoc(doc(db, 'site-content', 'contact'), stripUndefined(data), {
    merge: true,
  });
}

/**
 * Actualiza el arreglo de categorías en `site-config/categories` (Req 6.2).
 *
 * El documento almacena la forma `{ categories }`; se limpian campos
 * `undefined` antes de escribir.
 */
export async function updateCategories(cats: Category[]): Promise<void> {
  await setDoc(
    doc(db, 'site-config', 'categories'),
    stripUndefined({ categories: cats }),
    { merge: true },
  );
}

/** Actualiza el estilo de la galería en `site-config/gallery-style` (Req 11.3). */
export async function updateGalleryStyle(s: GalleryStyle): Promise<void> {
  await setDoc(doc(db, 'site-config', 'gallery-style'), stripUndefined(s), {
    merge: true,
  });
}
