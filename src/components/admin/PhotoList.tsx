import { useMemo } from 'react';
import type { Category, Photo } from '../../data/types';

/**
 * Props de PhotoList.
 *
 * @property photos - Fotos existentes a listar (de `useSiteData().photos`).
 * @property categories - Categorías existentes, para resolver `categoryId` → nombre.
 * @property onEdit - Invocado al pulsar "Editar" una foto.
 * @property onDelete - Invocado al pulsar "Eliminar" una foto (recibe el `id`).
 * @property deletingId - `id` de la foto que se está eliminando (deshabilita su acción).
 */
export interface PhotoListProps {
  photos: readonly Photo[];
  categories: readonly Category[];
  onEdit: (photo: Photo) => void;
  onDelete: (id: string) => void;
  deletingId?: string | null;
}

/** Etiqueta legible para cada tamaño de foto. */
const SIZE_LABELS: Record<string, string> = {
  small: 'Pequeña',
  medium: 'Mediana',
  large: 'Grande',
  wide: 'Panorámica',
};

/**
 * PhotoList — lista las Fotos existentes con su título, categoría y tamaño, y
 * ofrece acciones de editar y eliminar por foto (Req 5.1, 5.5, 5.6).
 *
 * Resuelve `categoryId` al nombre de la categoría correspondiente; si la
 * categoría ya no existe, muestra el `categoryId` crudo como respaldo.
 */
export default function PhotoList({
  photos,
  categories,
  onEdit,
  onDelete,
  deletingId,
}: PhotoListProps) {
  // Índice categoryId → name para resolver el nombre en O(1) por foto.
  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) {
      map.set(c.id, c.name);
    }
    return map;
  }, [categories]);

  if (photos.length === 0) {
    return (
      <p className="font-body text-sm text-text-primary/60">
        No hay fotos todavía. Crea la primera con el formulario de arriba.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-accent/20 rounded-md border border-accent/20">
      {photos.map((photo) => {
        const categoryName =
          categoryNameById.get(photo.categoryId) ?? photo.categoryId;
        const sizeLabel = SIZE_LABELS[photo.size ?? 'medium'];
        const isDeleting = deletingId === photo.id;

        return (
          <li
            key={photo.id}
            className="flex flex-wrap items-center justify-between gap-4 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              {photo.url !== '' && (
                <img
                  src={photo.url}
                  alt=""
                  className="h-12 w-12 flex-shrink-0 rounded object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="truncate font-body text-sm font-semibold text-text-primary">
                  {photo.title}
                </p>
                <p className="font-body text-xs text-text-primary/60">
                  {categoryName} · {sizeLabel}
                </p>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(photo)}
                disabled={isDeleting}
                className="rounded-md border border-accent/40 px-3 py-1.5 font-body text-sm font-semibold text-text-primary transition-colors hover:bg-accent hover:text-bg-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => onDelete(photo.id)}
                disabled={isDeleting}
                className="rounded-md border border-red-500/40 px-3 py-1.5 font-body text-sm font-semibold text-red-400 transition-colors hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
