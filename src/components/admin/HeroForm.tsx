import { useRef, useState } from 'react';
import type { AdminFormProps } from './types';
import { useSiteData } from '../../contexts/SiteDataContext';
import { validateImageFile } from '../../lib/validation';
import { uploadFile, updateHero } from '../../lib/admin';
import type { HeroData } from '../../data/types';

/** Límite de caracteres del campo `name` (Req 7.1). */
const NAME_MAX = 60;
/** Límite de caracteres del campo `subtitle` (Req 7.1). */
const SUBTITLE_MAX = 120;

/** Estado del guardado del formulario. */
type Status = 'idle' | 'saving';

/**
 * HeroForm (admin) — gestión del Hero (Req 7).
 *
 * Campos:
 * - `name` (≤ 60) y `subtitle` (≤ 120), precargados desde `useSiteData().hero`.
 * - Control de carga para la imagen de fondo, validado con `validateImageFile`
 *   (acepta `image/jpeg|png|webp`, ≤ 5 MB).
 *
 * Comportamiento:
 * - Al seleccionar un archivo inválido, se rechaza mostrando el criterio
 *   incumplido y se conserva la imagen previamente seleccionada sin subir
 *   nada a Storage (Req 7.3).
 * - Al guardar: si hay un archivo válido nuevo, primero se sube con
 *   `uploadFile`; si la subida falla, NO se llama a `updateHero` (el campo
 *   `backgroundUrl` no se escribe) y se muestra un error indicando que la
 *   subida falló (Req 7.8). Si no hay archivo nuevo, se conserva el
 *   `backgroundUrl` actual y se llama a `updateHero`.
 * - Éxito → mensaje de confirmación vía `onFeedback` (Req 7.6).
 * - Error → mensaje con la causa vía `onFeedback`, conservando los valores
 *   introducidos (Req 7.7).
 */
export default function HeroForm({ onFeedback }: AdminFormProps) {
  const { hero } = useSiteData();

  const [name, setName] = useState(hero.name);
  const [subtitle, setSubtitle] = useState(hero.subtitle);
  // Imagen de fondo actual persistida (se conserva si no se sube una nueva).
  const [backgroundUrl] = useState(hero.backgroundUrl);

  // Archivo válido seleccionado y pendiente de subir (null si no hay nuevo).
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [status, setStatus] = useState<Status>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saving = status === 'saving';

  /**
   * Valida el archivo seleccionado (Req 7.2/7.3). Si es inválido, se rechaza
   * mostrando el criterio incumplido y se conserva la selección previa sin
   * subir nada; si es válido, se recuerda para subirlo al guardar.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const result = validateImageFile(file);
    if (!result.ok) {
      // Rechaza el archivo, muestra el criterio incumplido y conserva la
      // imagen previamente seleccionada sin subirla (Req 7.3).
      setFileError(result.message);
      onFeedback('error', result.message);
      // Limpia el input para no dejar seleccionado un archivo inválido,
      // conservando `selectedFile` (la selección válida previa).
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setFileError(null);
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;

    setStatus('saving');

    try {
      let resolvedBackgroundUrl = backgroundUrl;

      // Si hay un archivo válido nuevo, subir primero (Req 7.4). Si la subida
      // falla, NO se escribe `backgroundUrl` ni se llama a `updateHero` (Req 7.8).
      if (selectedFile) {
        try {
          resolvedBackgroundUrl = await uploadFile(
            selectedFile,
            `hero/${Date.now()}-${selectedFile.name}`,
          );
        } catch {
          setStatus('idle');
          onFeedback(
            'error',
            'La subida de la imagen de fondo falló. No se guardaron los cambios.',
          );
          return;
        }
      }

      const data: HeroData = {
        name: name.trim(),
        subtitle: subtitle.trim(),
        backgroundUrl: resolvedBackgroundUrl,
      };

      await updateHero(data);

      // Éxito: refleja los valores guardados y confirma (Req 7.6).
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setStatus('idle');
      onFeedback('success', 'Hero guardado correctamente.');
    } catch (err) {
      // Fallo del guardado: mensaje con la causa, conserva los valores (Req 7.7).
      setStatus('idle');
      const cause = err instanceof Error ? err.message : 'error desconocido';
      onFeedback('error', `No se pudo guardar el Hero: ${cause}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-xl space-y-6">
      <div>
        <label
          htmlFor="hero-name"
          className="mb-1 block font-body text-sm text-text-primary/80"
        >
          Nombre
        </label>
        <input
          id="hero-name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={NAME_MAX}
          disabled={saving}
          className="w-full rounded-md border border-accent/40 bg-bg-secondary px-4 py-2 font-body text-text-primary placeholder:text-text-primary/50 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
          placeholder="Nicolás Restrepo"
        />
        <p className="mt-1 font-body text-xs text-text-primary/50">
          {name.length}/{NAME_MAX}
        </p>
      </div>

      <div>
        <label
          htmlFor="hero-subtitle"
          className="mb-1 block font-body text-sm text-text-primary/80"
        >
          Subtítulo
        </label>
        <input
          id="hero-subtitle"
          name="subtitle"
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          maxLength={SUBTITLE_MAX}
          disabled={saving}
          className="w-full rounded-md border border-accent/40 bg-bg-secondary px-4 py-2 font-body text-text-primary placeholder:text-text-primary/50 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
          placeholder="Fotografía de Viajes"
        />
        <p className="mt-1 font-body text-xs text-text-primary/50">
          {subtitle.length}/{SUBTITLE_MAX}
        </p>
      </div>

      <div>
        <label
          htmlFor="hero-background"
          className="mb-1 block font-body text-sm text-text-primary/80"
        >
          Imagen de fondo
        </label>
        <input
          ref={fileInputRef}
          id="hero-background"
          name="background"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={saving}
          aria-invalid={fileError !== null}
          aria-describedby={fileError !== null ? 'hero-file-error' : undefined}
          className="block w-full font-body text-sm text-text-primary/80 file:mr-4 file:rounded-md file:border-0 file:bg-accent file:px-4 file:py-2 file:font-body file:text-sm file:font-semibold file:text-bg-primary hover:file:opacity-90 disabled:opacity-60"
        />
        {fileError !== null && (
          <p
            id="hero-file-error"
            role="alert"
            className="mt-1 font-body text-xs text-red-500"
          >
            {fileError}
          </p>
        )}
        {selectedFile !== null ? (
          <p className="mt-1 font-body text-xs text-text-primary/60">
            Nueva imagen seleccionada: {selectedFile.name}
          </p>
        ) : (
          backgroundUrl.trim() !== '' && (
            <p className="mt-1 font-body text-xs text-text-primary/60">
              Imagen de fondo actual conservada.
            </p>
          )
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        aria-busy={saving}
        className="rounded-md bg-accent px-8 py-3 font-body font-semibold text-bg-primary transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? 'Guardando...' : 'Guardar Hero'}
      </button>
    </form>
  );
}
