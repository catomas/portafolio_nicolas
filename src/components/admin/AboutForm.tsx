import { useRef, useState } from 'react';
import type { AdminFormProps } from './types';
import { useSiteData } from '../../contexts/SiteDataContext';
import { validateImageFile } from '../../lib/validation';
import { uploadFile, updateAbout } from '../../lib/admin';
import type { AboutData, SocialLink } from '../../data/types';

/** Límite de caracteres del campo `bio` (Req 8.2). */
const BIO_MAX = 500;

/** Estado del guardado del formulario. */
type Status = 'idle' | 'saving';

/**
 * Comprueba que una cadena tenga un formato de URL válido (Req 8.4).
 * Usa el constructor `URL` en un try/catch; cualquier cadena que no pueda
 * parsearse como URL absoluta se considera inválida.
 */
function isValidUrl(value: string): boolean {
  try {
    // `new URL` lanza si el valor no es una URL absoluta válida.
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
}

/**
 * AboutForm (admin) — gestión del About (Req 8).
 *
 * Campos precargados desde `useSiteData().about`:
 * - `bio` (≤ 500) con contador de caracteres restante; se impide superar el
 *   límite (Req 8.2).
 * - Foto del fotógrafo: carga de archivo validada con `validateImageFile`
 *   (acepta `image/jpeg|png|webp`, ≤ 5 MB).
 * - `socialLinks`: se pueden agregar, editar y eliminar entradas con
 *   `platform` y `url`; la `url` se valida con formato de URL válido (Req 8.4).
 *
 * Comportamiento:
 * - Al seleccionar un archivo inválido, se rechaza mostrando el criterio
 *   incumplido y se conserva la selección previa sin subir nada.
 * - Al guardar: si hay un archivo válido nuevo, primero se sube con
 *   `uploadFile`; si la subida falla, NO se llama a `updateAbout` y se muestra
 *   un error (Req 8.7). Si no hay archivo nuevo, se conserva el
 *   `photographerPhotoUrl` actual.
 * - Antes de guardar se valida que todas las `url` de redes sociales tengan
 *   formato válido; si alguna es inválida se rechaza el guardado (Req 8.4).
 * - Éxito → mensaje de confirmación vía `onFeedback` (Req 8.6).
 * - Error → mensaje con la causa vía `onFeedback`, conservando los valores
 *   introducidos (Req 8.7).
 */
export default function AboutForm({ onFeedback }: AdminFormProps) {
  const { about } = useSiteData();

  const [bio, setBio] = useState(about.bio);
  // Foto del fotógrafo actual persistida (se conserva si no se sube una nueva).
  const [photographerPhotoUrl] = useState(about.photographerPhotoUrl ?? '');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    about.socialLinks.map((link) => ({ ...link })),
  );

  // Archivo válido seleccionado y pendiente de subir (null si no hay nuevo).
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [status, setStatus] = useState<Status>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saving = status === 'saving';
  const bioRemaining = BIO_MAX - bio.length;

  /**
   * Actualiza la `bio` impidiendo superar el límite (Req 8.2). El `maxLength`
   * del textarea ya lo evita, pero se recorta defensivamente por si el valor
   * llegara por otra vía.
   */
  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBio(e.target.value.slice(0, BIO_MAX));
  };

  /**
   * Valida el archivo seleccionado (Req 8.3). Si es inválido, se rechaza
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

  const handleAddLink = () => {
    setSocialLinks((prev) => [...prev, { platform: '', url: '' }]);
  };

  const handleRemoveLink = (index: number) => {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLinkChange = (
    index: number,
    field: keyof SocialLink,
    value: string,
  ) => {
    setSocialLinks((prev) =>
      prev.map((link, i) =>
        i === index ? { ...link, [field]: value } : link,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;

    // Validación de las URLs de redes sociales antes de guardar (Req 8.4).
    for (let i = 0; i < socialLinks.length; i += 1) {
      const link = socialLinks[i];
      if (link.url.trim() === '' || !isValidUrl(link.url)) {
        onFeedback(
          'error',
          `La URL de la red social #${i + 1} (${
            link.platform.trim() || 'sin nombre'
          }) no tiene un formato válido.`,
        );
        return;
      }
    }

    setStatus('saving');

    try {
      let resolvedPhotoUrl = photographerPhotoUrl;

      // Si hay un archivo válido nuevo, subir primero (Req 8.3). Si la subida
      // falla, NO se llama a `updateAbout` y se muestra un error (Req 8.7).
      if (selectedFile) {
        try {
          resolvedPhotoUrl = await uploadFile(
            selectedFile,
            `about/${Date.now()}-${selectedFile.name}`,
          );
        } catch {
          setStatus('idle');
          onFeedback(
            'error',
            'La subida de la foto del fotógrafo falló. No se guardaron los cambios.',
          );
          return;
        }
      }

      const normalizedLinks: SocialLink[] = socialLinks.map((link) => ({
        platform: link.platform.trim(),
        url: link.url.trim(),
      }));

      const data: AboutData = {
        bio: bio.trim(),
        socialLinks: normalizedLinks,
      };
      // Solo incluir la foto si existe alguna (nueva o conservada).
      if (resolvedPhotoUrl.trim() !== '') {
        data.photographerPhotoUrl = resolvedPhotoUrl;
      }

      await updateAbout(data);

      // Éxito: refleja los valores guardados y confirma (Req 8.6).
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setStatus('idle');
      onFeedback('success', 'About guardado correctamente.');
    } catch (err) {
      // Fallo del guardado: mensaje con la causa, conserva los valores (Req 8.7).
      setStatus('idle');
      const cause = err instanceof Error ? err.message : 'error desconocido';
      onFeedback('error', `No se pudo guardar el About: ${cause}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-xl space-y-6">
      <div>
        <label
          htmlFor="about-bio"
          className="mb-1 block font-body text-sm text-text-primary/80"
        >
          Biografía
        </label>
        <textarea
          id="about-bio"
          name="bio"
          value={bio}
          onChange={handleBioChange}
          maxLength={BIO_MAX}
          rows={6}
          disabled={saving}
          className="w-full resize-y rounded-md border border-accent/40 bg-bg-secondary px-4 py-2 font-body text-text-primary placeholder:text-text-primary/50 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
          placeholder="Fotógrafo colombiano especializado en..."
        />
        <p className="mt-1 font-body text-xs text-text-primary/50">
          {bioRemaining} caracteres restantes
        </p>
      </div>

      <div>
        <label
          htmlFor="about-photo"
          className="mb-1 block font-body text-sm text-text-primary/80"
        >
          Foto del fotógrafo
        </label>
        <input
          ref={fileInputRef}
          id="about-photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={saving}
          aria-invalid={fileError !== null}
          aria-describedby={fileError !== null ? 'about-file-error' : undefined}
          className="block w-full font-body text-sm text-text-primary/80 file:mr-4 file:rounded-md file:border-0 file:bg-accent file:px-4 file:py-2 file:font-body file:text-sm file:font-semibold file:text-bg-primary hover:file:opacity-90 disabled:opacity-60"
        />
        {fileError !== null && (
          <p
            id="about-file-error"
            role="alert"
            className="mt-1 font-body text-xs text-red-500"
          >
            {fileError}
          </p>
        )}
        {selectedFile !== null ? (
          <p className="mt-1 font-body text-xs text-text-primary/60">
            Nueva foto seleccionada: {selectedFile.name}
          </p>
        ) : (
          photographerPhotoUrl.trim() !== '' && (
            <p className="mt-1 font-body text-xs text-text-primary/60">
              Foto actual conservada.
            </p>
          )
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-display text-sm text-text-primary">
            Redes sociales
          </span>
          <button
            type="button"
            onClick={handleAddLink}
            disabled={saving}
            className="rounded-md border border-accent/40 px-3 py-1 font-body text-xs font-semibold text-accent transition-colors hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
          >
            + Agregar red
          </button>
        </div>

        {socialLinks.length === 0 ? (
          <p className="font-body text-xs text-text-primary/50">
            No hay redes sociales. Agrega una con el botón de arriba.
          </p>
        ) : (
          <ul className="space-y-3">
            {socialLinks.map((link, index) => (
              <li
                key={index}
                className="flex flex-col gap-2 rounded-md border border-accent/20 bg-bg-secondary p-3 sm:flex-row sm:items-center"
              >
                <input
                  type="text"
                  value={link.platform}
                  onChange={(e) =>
                    handleLinkChange(index, 'platform', e.target.value)
                  }
                  disabled={saving}
                  aria-label={`Plataforma de la red social ${index + 1}`}
                  className="w-full rounded-md border border-accent/40 bg-bg-primary px-3 py-2 font-body text-sm text-text-primary placeholder:text-text-primary/50 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60 sm:w-40"
                  placeholder="Instagram"
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) =>
                    handleLinkChange(index, 'url', e.target.value)
                  }
                  disabled={saving}
                  aria-label={`URL de la red social ${index + 1}`}
                  className="w-full flex-1 rounded-md border border-accent/40 bg-bg-primary px-3 py-2 font-body text-sm text-text-primary placeholder:text-text-primary/50 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
                  placeholder="https://instagram.com/usuario"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  disabled={saving}
                  aria-label={`Eliminar la red social ${index + 1}`}
                  className="rounded-md border border-red-500/40 px-3 py-2 font-body text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        aria-busy={saving}
        className="rounded-md bg-accent px-8 py-3 font-body font-semibold text-bg-primary transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? 'Guardando...' : 'Guardar About'}
      </button>
    </form>
  );
}
