import { useState } from 'react';
import type { AdminFormProps } from './types';
import { useSiteData } from '../../contexts/SiteDataContext';
import { validateGalleryStyle } from '../../lib/validation';
import { updateGalleryStyle } from '../../lib/admin';
import type { GalleryCorners, GalleryStyle } from '../../data/types';

/** Límite inferior del espaciado en px (Req 11.1). */
const GAP_MIN = 0;
/** Límite superior del espaciado en px (Req 11.1). */
const GAP_MAX = 64;

/** Estado del guardado del formulario. */
type Status = 'idle' | 'saving';

/** Opciones del selector de esquinas: exactamente dos (Req 11.2). */
const CORNER_OPTIONS: ReadonlyArray<{ value: GalleryCorners; label: string }> = [
  { value: 'square', label: 'Rectas' },
  { value: 'rounded', label: 'Redondeadas' },
];

/**
 * GalleryStyleForm (admin) — gestión del Estilo_Galeria (Req 11).
 *
 * Campos, precargados desde `useSiteData().galleryStyle`:
 * - `gap`: espaciado entre fotos, entero en [0, 64] px (Req 11.1). Se controla
 *   con un slider y un input numérico sincronizados.
 * - `corners`: estilo de esquinas con exactamente dos opciones — rectas
 *   (`square`) y redondeadas (`rounded`) (Req 11.2).
 *
 * Comportamiento:
 * - Antes de escribir se valida con `validateGalleryStyle` (Req 11.4). Si el
 *   valor es inválido no se llama al servicio, se reporta el error
 *   identificando el valor inválido y la configuración guardada permanece sin
 *   cambios.
 * - En un guardado válido se llama a `updateGalleryStyle`
 *   (`site-config/gallery-style`) (Req 11.3).
 * - Éxito → mensaje de confirmación vía `onFeedback` (Req 11.5).
 * - Fallo → mensaje de error vía `onFeedback`, conservando la configuración
 *   introducida (Req 11.6).
 */
export default function GalleryStyleForm({ onFeedback }: AdminFormProps) {
  const { galleryStyle } = useSiteData();

  // Valor del input como texto para permitir estados intermedios (p.ej. vacío)
  // sin forzar un número; se valida al guardar.
  const [gap, setGap] = useState<string>(String(galleryStyle.gap));
  const [corners, setCorners] = useState<GalleryCorners>(galleryStyle.corners);

  const [status, setStatus] = useState<Status>('idle');
  const saving = status === 'saving';

  // Valor numérico acotado para el slider (que no acepta texto libre).
  const parsedGap = Number.parseInt(gap, 10);
  const sliderValue = Number.isNaN(parsedGap)
    ? GAP_MIN
    : Math.min(GAP_MAX, Math.max(GAP_MIN, parsedGap));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;

    // `gap` se interpreta como entero; NaN se envía tal cual para que el
    // validador lo rechace con un mensaje claro (Req 11.4).
    const candidate: GalleryStyle = {
      gap: Number.parseInt(gap, 10),
      corners,
    };

    // Validar ANTES de escribir. Si es inválido no se invoca el servicio y la
    // configuración guardada permanece sin cambios (Req 11.4).
    const result = validateGalleryStyle(candidate);
    if (!result.ok) {
      onFeedback('error', result.message);
      return;
    }

    setStatus('saving');
    try {
      await updateGalleryStyle(candidate);
      // Normaliza el input al valor persistido y confirma (Req 11.5).
      setGap(String(candidate.gap));
      setStatus('idle');
      onFeedback('success', 'Estilo de galería guardado correctamente.');
    } catch (err) {
      // Fallo del guardado: mensaje con la causa, conserva la config (Req 11.6).
      setStatus('idle');
      const cause = err instanceof Error ? err.message : 'error desconocido';
      onFeedback('error', `No se pudo guardar el estilo de galería: ${cause}`);
    }
  };

  return (
    <section aria-labelledby="gallery-style-heading" className="max-w-xl">
      <h2
        id="gallery-style-heading"
        className="font-display text-lg font-bold text-text-primary"
      >
        Estilo de galería
      </h2>
      <p className="mt-1 font-body text-sm text-text-primary/60">
        Ajusta el espaciado entre fotos (0–64 px) y el estilo de las esquinas de
        las tarjetas de la galería.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">
        {/* Control de espaciado (gap) — Req 11.1 */}
        <div>
          <label
            htmlFor="gallery-gap-number"
            className="mb-1 block font-body text-sm text-text-primary/80"
          >
            Espaciado (px)
          </label>
          <div className="flex items-center gap-4">
            <input
              id="gallery-gap-range"
              name="gap-range"
              type="range"
              min={GAP_MIN}
              max={GAP_MAX}
              step={1}
              value={sliderValue}
              onChange={(e) => setGap(e.target.value)}
              disabled={saving}
              aria-label="Espaciado entre fotos en píxeles"
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-bg-secondary accent-accent disabled:opacity-60"
            />
            <input
              id="gallery-gap-number"
              name="gap"
              type="number"
              min={GAP_MIN}
              max={GAP_MAX}
              step={1}
              value={gap}
              onChange={(e) => setGap(e.target.value)}
              disabled={saving}
              className="w-24 rounded-md border border-accent/40 bg-bg-secondary px-3 py-2 font-body text-text-primary transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
            />
          </div>
          <p className="mt-1 font-body text-xs text-text-primary/50">
            Valor entero entre {GAP_MIN} y {GAP_MAX} píxeles.
          </p>
        </div>

        {/* Selector de esquinas — Req 11.2 */}
        <fieldset disabled={saving} className="space-y-2">
          <legend className="mb-1 block font-body text-sm text-text-primary/80">
            Esquinas
          </legend>
          <div className="flex gap-3">
            {CORNER_OPTIONS.map((option) => {
              const selected = corners === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 font-body text-sm transition-colors ${
                    selected
                      ? 'border-accent bg-accent/10 text-text-primary'
                      : 'border-accent/40 bg-bg-secondary text-text-primary/70 hover:bg-accent/5'
                  } ${saving ? 'opacity-60' : ''}`}
                >
                  <input
                    type="radio"
                    name="corners"
                    value={option.value}
                    checked={selected}
                    onChange={() => setCorners(option.value)}
                    disabled={saving}
                    className="accent-accent"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={saving}
          aria-busy={saving}
          className="rounded-md bg-accent px-8 py-3 font-body font-semibold text-bg-primary transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar estilo'}
        </button>
      </form>
    </section>
  );
}
