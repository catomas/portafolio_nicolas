import type { PhotoSize } from '../data/types';

/**
 * Metadatos de presentación para cada tamaño de foto del grid (Req 5.4).
 *
 * - `label`: etiqueta legible en español con una pista de la proporción.
 * - `grid`: notación `columnas×filas` usada para dibujar un mini-diagrama de
 *   cómo ocupa la foto el grid tipo mosaico.
 *
 * Compartido para poder reutilizarse tanto en `PhotoForm` como en
 * `GalleryEditor`.
 */
export const PHOTO_SIZE_META: Record<
  PhotoSize,
  { label: string; grid: string }
> = {
  small: { label: 'Pequeña', grid: '1×1' },
  medium: { label: 'Vertical', grid: '1×2' },
  wide: { label: 'Panorámica', grid: '2×1' },
  large: { label: 'Grande', grid: '2×2' },
  tall: { label: 'Muy vertical', grid: '1×3' },
  extraWide: { label: 'Banner', grid: '3×1' },
  big: { label: 'Enorme', grid: '3×3' },
  landscape: { label: 'Rectángulo', grid: '3×2' },
};

/** Orden estable de tamaños para renderizar selectores. */
export const PHOTO_SIZE_ORDER: ReadonlyArray<PhotoSize> = [
  'small',
  'medium',
  'tall',
  'wide',
  'extraWide',
  'large',
  'landscape',
  'big',
];

/**
 * Parsea la notación `columnas×filas` de `PHOTO_SIZE_META[size].grid`.
 * Útil para dibujar un mini-diagrama del área que ocupa la foto.
 */
export function parseGridDimensions(size: PhotoSize): {
  cols: number;
  rows: number;
} {
  const [cols, rows] = PHOTO_SIZE_META[size].grid.split('×').map(Number);
  return { cols, rows };
}
