import type { Category, GalleryCorners, GalleryStyle, PhotoSize } from '../data/types';

/**
 * Resultado de una validación pura.
 * - `{ ok: true }` cuando la entrada es válida.
 * - `{ ok: false, field, message }` cuando es inválida, identificando el campo y la causa.
 */
export type ValidationResult =
  | { ok: true }
  | { ok: false; field: string; message: string };

const ok: ValidationResult = { ok: true };

const fail = (field: string, message: string): ValidationResult => ({
  ok: false,
  field,
  message,
});

/** Tipos MIME de imagen aceptados para subir a Storage (Req 7.2/7.3). */
const ALLOWED_IMAGE_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

/** Tamaño máximo de imagen permitido: 5 MB (Req 7.2/7.3). */
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/** Valores válidos para el estilo de esquinas de la galería (Req 11.4). */
const VALID_CORNERS: readonly GalleryCorners[] = ['square', 'rounded'];

/** Datos de entrada para crear/editar una Foto desde el formulario admin. */
export interface PhotoInput {
  /** Archivo de imagen seleccionado. Requerido al crear (Req 5.3). */
  file?: File | null;
  /** Título de la foto. */
  title: string;
  /** Categoría seleccionada (debe existir). */
  categoryId: string;
  /** Tamaño en el grid (opcional, default 'medium' en la capa de servicio). */
  size?: PhotoSize;
}

/**
 * Valida la entrada de creación de una Foto (Req 5.2/5.3).
 * Exige archivo, título recortado de 1–100 caracteres y una categoría existente.
 *
 * @param input Datos del formulario de la foto.
 * @param existingCategoryIds Conjunto de `id` de categorías existentes.
 */
export function validatePhotoInput(
  input: PhotoInput,
  existingCategoryIds: ReadonlySet<string> | readonly string[],
): ValidationResult {
  if (!input.file) {
    return fail('file', 'Debes seleccionar un archivo de imagen.');
  }

  const title = input.title.trim();
  if (title.length < 1) {
    return fail('title', 'El título es obligatorio.');
  }
  if (title.length > 100) {
    return fail('title', 'El título no puede superar los 100 caracteres.');
  }

  const categoryId = input.categoryId.trim();
  const known =
    existingCategoryIds instanceof Set
      ? existingCategoryIds
      : new Set(existingCategoryIds);
  if (categoryId.length < 1 || !known.has(categoryId)) {
    return fail('categoryId', 'Debes seleccionar una categoría existente.');
  }

  return ok;
}

/**
 * Valida una Categoria al crear o editar (Req 6.3/6.4).
 * `id` recortado de 1–50 caracteres y único; `name` recortado de 1–60 caracteres.
 *
 * @param cat Categoría propuesta.
 * @param existingCats Categorías existentes en el arreglo.
 * @param editingId Si se está editando, el `id` original (excluido del chequeo de unicidad).
 */
export function validateCategory(
  cat: Category,
  existingCats: readonly Category[],
  editingId?: string,
): ValidationResult {
  const id = cat.id.trim();
  if (id.length < 1) {
    return fail('id', 'El id de la categoría es obligatorio.');
  }
  if (id.length > 50) {
    return fail('id', 'El id no puede superar los 50 caracteres.');
  }

  const name = cat.name.trim();
  if (name.length < 1) {
    return fail('name', 'El nombre de la categoría es obligatorio.');
  }
  if (name.length > 60) {
    return fail('name', 'El nombre no puede superar los 60 caracteres.');
  }

  const editing = editingId?.trim();
  const duplicated = existingCats.some(
    (c) => c.id.trim() === id && c.id.trim() !== editing,
  );
  if (duplicated) {
    return fail('id', 'Ya existe una categoría con ese id.');
  }

  return ok;
}

/**
 * Valida un archivo de imagen para subida (Req 7.2/7.3).
 * Acepta `image/jpeg | image/png | image/webp` con tamaño ≤ 5 MB.
 */
export function validateImageFile(file: File): ValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return fail(
      'file',
      'El archivo debe ser una imagen JPEG, PNG o WebP.',
    );
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return fail('file', 'La imagen no puede superar los 5 MB.');
  }
  return ok;
}

/**
 * Valida el contenido de la sección de contacto del admin (Req 10.1/10.3).
 * Rechaza campos vacíos o compuestos solo por espacios; `title` ≤ 100, `subtitle` ≤ 300.
 */
export function validateContactContent(
  title: string,
  subtitle: string,
): ValidationResult {
  const t = title.trim();
  if (t.length < 1) {
    return fail('title', 'El título es obligatorio.');
  }
  if (t.length > 100) {
    return fail('title', 'El título no puede superar los 100 caracteres.');
  }

  const s = subtitle.trim();
  if (s.length < 1) {
    return fail('subtitle', 'El subtítulo es obligatorio.');
  }
  if (s.length > 300) {
    return fail('subtitle', 'El subtítulo no puede superar los 300 caracteres.');
  }

  return ok;
}

/**
 * Valida el Estilo_Galeria (Req 11.4).
 * `gap` entero en el rango [0, 64]; `corners ∈ {'square','rounded'}`.
 */
export function validateGalleryStyle(style: GalleryStyle): ValidationResult {
  const { gap, corners } = style;
  if (!Number.isInteger(gap) || gap < 0 || gap > 64) {
    return fail('gap', 'El espaciado debe ser un entero entre 0 y 64.');
  }
  if (!VALID_CORNERS.includes(corners)) {
    return fail('corners', 'El estilo de esquinas debe ser "square" o "rounded".');
  }
  return ok;
}

/**
 * Valida el mensaje del formulario de contacto público (Req 12.2/12.3).
 * `name` 1–100 caracteres; `message` 1–2000 caracteres; email con `@`,
 * al menos un carácter antes y un dominio con al menos un punto después.
 */
export function validateContactMessage(
  name: string,
  email: string,
  message: string,
): ValidationResult {
  const n = name.trim();
  if (n.length < 1) {
    return fail('name', 'El nombre es obligatorio.');
  }
  if (n.length > 100) {
    return fail('name', 'El nombre no puede superar los 100 caracteres.');
  }

  if (!isValidEmail(email)) {
    return fail('email', 'El email no tiene un formato válido.');
  }

  const m = message.trim();
  if (m.length < 1) {
    return fail('message', 'El mensaje es obligatorio.');
  }
  if (m.length > 2000) {
    return fail('message', 'El mensaje no puede superar los 2000 caracteres.');
  }

  return ok;
}

/**
 * Comprueba el formato de email exigido por Req 12.2:
 * contiene un `@` con al menos un carácter antes y un dominio con al menos
 * un punto después que separe segmentos no vacíos.
 */
function isValidEmail(email: string): boolean {
  const value = email.trim();
  const at = value.indexOf('@');
  // Debe existir exactamente una arroba con al menos un carácter antes.
  if (at < 1) return false;
  if (value.indexOf('@', at + 1) !== -1) return false;

  const domain = value.slice(at + 1);
  const dot = domain.indexOf('.');
  // El dominio debe contener un punto que no esté al inicio ni al final,
  // dejando segmentos no vacíos a ambos lados.
  if (dot < 1 || dot === domain.length - 1) return false;

  // Ningún carácter de espacio en blanco es válido en el email.
  if (/\s/.test(value)) return false;

  return true;
}
