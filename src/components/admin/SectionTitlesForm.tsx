import { useState } from 'react';
import type { AdminFormProps } from './types';
import { useSiteData } from '../../contexts/SiteDataContext';
import { updateSectionTitles } from '../../lib/admin';

/** Límite de caracteres de cada título de sección. */
const TITLE_MAX = 60;

/** Estado del guardado del formulario. */
type Status = 'idle' | 'saving';

/**
 * SectionTitlesForm (admin) — editor de los títulos de las secciones de
 * galería y marcas, persistidos en `site-content/sections`.
 *
 * Campos, precargados desde `useSiteData().sections`:
 * - `gallery` (≤ 60): título de la galería (default 'Galería').
 * - `brands` (≤ 60): título de la sección de marcas (default 'Marcas').
 *
 * Comportamiento:
 * - Al guardar persiste con `updateSectionTitles`, aplicando los valores por
 *   defecto cuando el campo queda vacío.
 * - Éxito → mensaje de confirmación vía `onFeedback`.
 * - Error → mensaje con la causa vía `onFeedback`, conservando los valores.
 */
export default function SectionTitlesForm({ onFeedback }: AdminFormProps) {
  const { sections } = useSiteData();

  const [gallery, setGallery] = useState(sections.gallery ?? 'Galería');
  const [brands, setBrands] = useState(sections.brands ?? 'Marcas');
  const [status, setStatus] = useState<Status>('idle');

  const saving = status === 'saving';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;

    setStatus('saving');

    try {
      await updateSectionTitles({
        gallery: gallery.trim() || 'Galería',
        brands: brands.trim() || 'Marcas',
      });
      setStatus('idle');
      onFeedback('success', 'Títulos de sección guardados correctamente.');
    } catch (err) {
      // Fallo del guardado: mensaje con la causa, conserva los valores.
      setStatus('idle');
      const cause = err instanceof Error ? err.message : 'error desconocido';
      onFeedback('error', `No se pudo guardar los títulos: ${cause}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-xl space-y-6">
      <div>
        <label
          htmlFor="sections-gallery"
          className="mb-1 block font-body text-sm text-text-primary/80"
        >
          Título de la galería
        </label>
        <input
          id="sections-gallery"
          name="gallery"
          type="text"
          value={gallery}
          onChange={(e) => setGallery(e.target.value)}
          maxLength={TITLE_MAX}
          disabled={saving}
          className="w-full rounded-md border border-accent/40 bg-bg-secondary px-4 py-2 font-body text-text-primary placeholder:text-text-primary/50 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
          placeholder="Galería"
        />
        <p className="mt-1 font-body text-xs text-text-primary/50">
          {gallery.length}/{TITLE_MAX}
        </p>
      </div>

      <div>
        <label
          htmlFor="sections-brands"
          className="mb-1 block font-body text-sm text-text-primary/80"
        >
          Título de la sección de marcas
        </label>
        <input
          id="sections-brands"
          name="brands"
          type="text"
          value={brands}
          onChange={(e) => setBrands(e.target.value)}
          maxLength={TITLE_MAX}
          disabled={saving}
          className="w-full rounded-md border border-accent/40 bg-bg-secondary px-4 py-2 font-body text-text-primary placeholder:text-text-primary/50 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
          placeholder="Marcas"
        />
        <p className="mt-1 font-body text-xs text-text-primary/50">
          {brands.length}/{TITLE_MAX}
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        aria-busy={saving}
        className="rounded-md bg-accent px-8 py-3 font-body font-semibold text-bg-primary transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
}
