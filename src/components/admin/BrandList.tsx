import type { Brand } from '../../data/types';

/**
 * Props de BrandList.
 *
 * @property brands - Marcas existentes a listar (de `useSiteData().brands`).
 * @property onEdit - Invocado al pulsar "Editar" una marca.
 * @property onDelete - Invocado al pulsar "Eliminar" una marca (recibe el `id`).
 * @property deletingId - `id` de la marca que se está eliminando (deshabilita su acción).
 */
export interface BrandListProps {
  brands: readonly Brand[];
  onEdit: (brand: Brand) => void;
  onDelete: (id: string) => void;
  deletingId?: string | null;
}

/**
 * BrandList — lista las Marcas existentes mostrando su nombre y logo, con
 * acciones de editar y eliminar por marca (Req 9.1, 9.4, 9.5).
 *
 * `brands` puede llegar vacío; en ese caso muestra un mensaje guía.
 */
export default function BrandList({
  brands,
  onEdit,
  onDelete,
  deletingId,
}: BrandListProps) {
  if (brands.length === 0) {
    return (
      <p className="font-body text-sm text-text-primary/60">
        No hay marcas todavía. Crea la primera con el formulario de arriba.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-accent/20 rounded-md border border-accent/20">
      {brands.map((brand) => {
        const isDeleting = deletingId === brand.id;

        return (
          <li
            key={brand.id}
            className="flex flex-wrap items-center justify-between gap-4 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              {brand.logoUrl !== '' && (
                <img
                  src={brand.logoUrl}
                  alt=""
                  className="h-12 w-12 flex-shrink-0 rounded object-contain"
                />
              )}
              <p className="truncate font-body text-sm font-semibold text-text-primary">
                {brand.name}
              </p>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(brand)}
                disabled={isDeleting}
                className="rounded-md border border-accent/40 px-3 py-1.5 font-body text-sm font-semibold text-text-primary transition-colors hover:bg-accent hover:text-bg-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => onDelete(brand.id)}
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
