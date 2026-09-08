import type { Photo } from '../data/types';

/**
 * Ordena las Fotos por su campo de orden según el modo:
 * - `'global'`   → por `order` ascendente (galería sin filtro, Req 15.11)
 * - `'category'` → por `categoryOrder` ascendente (categoría seleccionada, Req 15.12)
 *
 * Las Fotos sin el campo de orden correspondiente se tratan como si su valor
 * fuese `+Infinity`, ubicándolas al final. El desempate (para valores iguales o
 * ambos ausentes) usa el índice original de la Foto en la entrada, garantizando
 * un resultado determinista y estable (Req 15.13).
 *
 * No muta la entrada: opera sobre una copia y devuelve una permutación (los
 * mismos elementos, sin pérdidas ni duplicados).
 *
 * @param photos Lista de Fotos a ordenar (no se modifica).
 * @param mode   `'global'` usa `order`; `'category'` usa `categoryOrder`.
 * @returns Nueva lista ordenada ascendentemente por el campo del modo.
 */
export function sortPhotosByOrder(
  photos: Photo[],
  mode: 'global' | 'category',
): Photo[] {
  const field = mode === 'global' ? 'order' : 'categoryOrder';

  return photos
    .map((photo, index) => ({ photo, index }))
    .sort((a, b) => {
      const av = a.photo[field] ?? Number.POSITIVE_INFINITY;
      const bv = b.photo[field] ?? Number.POSITIVE_INFINITY;
      if (av !== bv) return av - bv;
      return a.index - b.index;
    })
    .map((entry) => entry.photo);
}
