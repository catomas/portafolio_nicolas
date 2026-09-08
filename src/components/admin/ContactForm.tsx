import { useState } from 'react';
import type { AdminFormProps } from './types';
import { useSiteData } from '../../contexts/SiteDataContext';
import { validateContactContent } from '../../lib/validation';
import { updateContact } from '../../lib/admin';
import type { ContactData } from '../../data/types';

/** Límite de caracteres del campo `title` (Req 10.1). */
const TITLE_MAX = 100;
/** Límite de caracteres del campo `subtitle` (Req 10.1). */
const SUBTITLE_MAX = 300;

/** Estado del guardado del formulario. */
type Status = 'idle' | 'saving';

/**
 * ContactForm (admin) — editor del contenido de la sección de contacto (Req 10).
 *
 * Distinto del `ContactForm` público (`src/components/ContactForm.tsx`), que
 * envía mensajes vía EmailJS. Este formulario edita el contenido persistido en
 * `site-content/contact`.
 *
 * Campos:
 * - `title` (≤ 100) y `subtitle` (≤ 300), precargados desde
 *   `useSiteData().contact` (Req 10.1).
 *
 * Comportamiento:
 * - Antes de escribir, valida con `validateContactContent`, que rechaza campos
 *   vacíos o compuestos solo por espacios. Si es inválido, NO se llama a
 *   `updateContact` y se muestra un error identificando el campo (Req 10.3).
 * - Al guardar válido, persiste con `updateContact` en `site-content/contact`
 *   (Req 10.2).
 * - Éxito → mensaje de confirmación vía `onFeedback` (Req 10.4).
 * - Error → mensaje con la causa vía `onFeedback`, conservando los valores
 *   introducidos (Req 10.5).
 */
export default function ContactForm({ onFeedback }: AdminFormProps) {
  const { contact } = useSiteData();

  const [title, setTitle] = useState(contact.title);
  const [subtitle, setSubtitle] = useState(contact.subtitle ?? '');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  const saving = status === 'saving';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;

    // Validación previa a la escritura (Req 10.3). Si es inválida, no se llama
    // al servicio y se muestra el campo/causa; los valores se conservan.
    const result = validateContactContent(title, subtitle);
    if (!result.ok) {
      setFieldError(result.field);
      onFeedback('error', result.message);
      return;
    }

    setFieldError(null);
    setStatus('saving');

    const data: ContactData = {
      title: title.trim(),
      subtitle: subtitle.trim(),
    };

    try {
      await updateContact(data);
      setStatus('idle');
      onFeedback('success', 'Contacto guardado correctamente.');
    } catch (err) {
      // Fallo del guardado: mensaje con la causa, conserva los valores (Req 10.5).
      setStatus('idle');
      const cause = err instanceof Error ? err.message : 'error desconocido';
      onFeedback('error', `No se pudo guardar el contacto: ${cause}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-xl space-y-6">
      <div>
        <label
          htmlFor="contact-title"
          className="mb-1 block font-body text-sm text-text-primary/80"
        >
          Título
        </label>
        <input
          id="contact-title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={TITLE_MAX}
          disabled={saving}
          aria-invalid={fieldError === 'title'}
          aria-describedby={fieldError === 'title' ? 'contact-error' : undefined}
          className="w-full rounded-md border border-accent/40 bg-bg-secondary px-4 py-2 font-body text-text-primary placeholder:text-text-primary/50 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
          placeholder="Contacto"
        />
        <p className="mt-1 font-body text-xs text-text-primary/50">
          {title.length}/{TITLE_MAX}
        </p>
      </div>

      <div>
        <label
          htmlFor="contact-subtitle"
          className="mb-1 block font-body text-sm text-text-primary/80"
        >
          Subtítulo
        </label>
        <textarea
          id="contact-subtitle"
          name="subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          maxLength={SUBTITLE_MAX}
          disabled={saving}
          rows={4}
          aria-invalid={fieldError === 'subtitle'}
          aria-describedby={
            fieldError === 'subtitle' ? 'contact-error' : undefined
          }
          className="w-full resize-y rounded-md border border-accent/40 bg-bg-secondary px-4 py-2 font-body text-text-primary placeholder:text-text-primary/50 transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
          placeholder="¿Tienes un proyecto en mente? Hablemos."
        />
        <p className="mt-1 font-body text-xs text-text-primary/50">
          {subtitle.length}/{SUBTITLE_MAX}
        </p>
      </div>

      {fieldError !== null && (
        <p id="contact-error" role="alert" className="font-body text-xs text-red-500">
          Revisa el campo {fieldError === 'title' ? 'Título' : 'Subtítulo'}.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        aria-busy={saving}
        className="rounded-md bg-accent px-8 py-3 font-body font-semibold text-bg-primary transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? 'Guardando...' : 'Guardar contacto'}
      </button>
    </form>
  );
}
