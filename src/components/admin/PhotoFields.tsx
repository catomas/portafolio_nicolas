import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import type { FeedbackKind } from './types';
import type { Photo, PhotoSize } from '../../data/types';
import { useSiteData } from '../../contexts/SiteDataContext';
import { validatePhotoInput, validateImageFile } from '../../lib/validation';
import { createPhoto, updatePhoto } from '../../lib/admin';
import {
  PHOTO_SIZE_META,
  PHOTO_SIZE_ORDER,
  parseGridDimensions,
} from '../../lib/photoSizeMeta';

/**
 * Mini-diagrama que representa cómo ocupa la foto el grid tipo mosaico,
 * derivado de `PHOTO_SIZE_META[size].grid` (Req 5.4). Copiado de `PhotoForm`
 * para mantener idéntica la representación del selector de tamaño.
 */
function GridHint({ size }: { size: PhotoSize }) {
  const { cols, rows } = parseGridDimensions(size);
  return (
    <span
      aria-hidden="true"
      className="grid gap-0.5"
      style={{
        gridTemplateColumns: `repeat(${cols}, 0.5rem)`,
        gridTemplateRows: `repeat(${rows}, 0.5rem)`,
      }}
    >
      {Array.from({ length: cols * rows }).map((_, i) => (
        <span key={i} className="h-2 w-2 rounded-[2px] bg-accent" />
      ))}
    </span>
  );
}

/** Estado editable del formulario de foto. */
interface FormState {
  title: string;
  categoryId: string;
  size: PhotoSize;
}

const EMPTY_FORM: FormState = { title: '', categoryId: '', size: 'medium' };

/**
 * Props de PhotoFields — formulario CONTROLADO de creación/edición de fotos.
 *
 * A diferencia de `PhotoForm`, este componente no posee la lista de fotos ni el
 * estado del objetivo de edición: el padre (`GalleryEditor`) decide qué foto se
 * edita mediante `editingPhoto` y reacciona a `onSaved`/`onCancelEdit`.
 *
 * @property editingPhoto - Foto a editar; `null` para modo creación.
 * @property onSaved - Invocado tras crear/actualizar con éxito (el padre limpia
 *   el objetivo de edición).
 * @property onCancelEdit - Invocado al pulsar "Cancelar" en modo edición.
 * @property onFeedback - Reporta éxito/error al banner de AdminPage.
 */
export interface PhotoFieldsProps {
  editingPhoto: Photo | null;
  onSaved: () => void;
  onCancelEdit: () => void;
  onFeedback: (kind: FeedbackKind, message: string) => void;
}

/**
 * PhotoFields — formulario controlado de create/edit de Fotos.
 *
 * Reutiliza el marcado y la validación de `PhotoForm` (archivo con
 * `validateImageFile`, título ≤100, selector de categoría desde
 * `useSiteData().categories`, y el selector de tamaño con `GridHint`), pero sin
 * lista interna ni estado propio del objetivo de edición. Precarga sus campos
 * desde `editingPhoto` mediante un efecto sobre `editingPhoto?.id` y, al crear,
 * calcula `order`/`categoryOrder` appendeando al final (Req 5.10, 5.11, 15.7,
 * 15.8); al editar, si cambia la categoría, recalcula `categoryOrder` al final
 * de la categoría destino.
 */
export default function PhotoFields({
  editingPhoto,
  onSaved,
  onCancelEdit,
  onFeedback,
}: PhotoFieldsProps) {
  const { photos, categories } = useSiteData();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [fieldError, setFieldError] = useState<{
    field: string;
    message: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingCategoryIds = useMemo(
    () => categories.map((c) => c.id),
    [categories],
  );

  const isEditing = editingPhoto !== null;

  // Precargar/resetear el formulario cuando cambia el objetivo de edición.
  useEffect(() => {
    if (editingPhoto) {
      setForm({
        title: editingPhoto.title,
        categoryId: editingPhoto.categoryId,
        size: editingPhoto.size ?? 'medium',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setFile(null);
    setFieldError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Keyed en el id de la foto para reaccionar a cada cambio de objetivo.
  }, [editingPhoto?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileChange = (selected: File | null) => {
    setFieldError(null);
    if (selected) {
      const fileResult = validateImageFile(selected);
      if (!fileResult.ok) {
        setFieldError({ field: fileResult.field, message: fileResult.message });
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
    }
    setFile(selected);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    setFieldError(null);

    // Validación previa a cualquier escritura (Req 5.3, 5.9). En edición, si no
    // se seleccionó archivo nuevo, se conserva la imagen existente.
    if (isEditing && !file) {
      if (form.title.trim().length < 1) {
        setFieldError({ field: 'title', message: 'El título es obligatorio.' });
        return;
      }
      if (form.title.trim().length > 100) {
        setFieldError({
          field: 'title',
          message: 'El título no puede superar los 100 caracteres.',
        });
        return;
      }
      if (!existingCategoryIds.includes(form.categoryId)) {
        setFieldError({
          field: 'categoryId',
          message: 'Debes seleccionar una categoría existente.',
        });
        return;
      }
    } else {
      const result = validatePhotoInput(
        { file, title: form.title, categoryId: form.categoryId, size: form.size },
        existingCategoryIds,
      );
      if (!result.ok) {
        setFieldError({ field: result.field, message: result.message });
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isEditing && editingPhoto) {
        // Si cambia la categoría, reubicar al final de la categoría destino:
        // `categoryOrder` = nº de fotos en la categoría destino excluyendo esta.
        const categoryChanged = form.categoryId !== editingPhoto.categoryId;
        const categoryOrder = categoryChanged
          ? photos.filter(
              (p) => p.categoryId === form.categoryId && p.id !== editingPhoto.id,
            ).length
          : undefined;

        await updatePhoto(editingPhoto.id, {
          file: file ?? undefined,
          title: form.title.trim(),
          categoryId: form.categoryId,
          size: form.size,
          categoryOrder,
        });
        onFeedback('success', 'Foto actualizada correctamente.');
      } else {
        // Al crear, appendear al final del orden global y de su categoría.
        const categoryOrder = photos.filter(
          (p) => p.categoryId === form.categoryId,
        ).length;

        await createPhoto({
          file: file ?? undefined,
          title: form.title.trim(),
          categoryId: form.categoryId,
          size: form.size,
          order: photos.length,
          categoryOrder,
        });
        onFeedback('success', 'Foto creada correctamente.');
      }
      onSaved();
    } catch (err) {
      const operation = isEditing ? 'actualizar' : 'crear';
      const cause = err instanceof Error ? err.message : 'error desconocido';
      onFeedback('error', `No se pudo ${operation} la foto: ${cause}.`);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-md border border-accent/40 bg-bg-primary px-4 py-2 font-body text-text-primary placeholder:text-text-primary/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent transition-colors disabled:opacity-60';

  const errorFor = (field: string) =>
    fieldError?.field === field ? fieldError.message : null;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-5"
      noValidate
    >
      <h2 className="font-display text-lg font-bold text-text-primary">
        {isEditing ? 'Editar foto' : 'Nueva foto'}
      </h2>

      <div>
        <label
          htmlFor="photo-file"
          className="mb-1 block font-body text-sm text-text-primary/80"
        >
          Imagen{' '}
          {isEditing && (
            <span className="text-text-primary/50">
              (opcional; deja vacío para conservar la actual)
            </span>
          )}
        </label>
        <input
          id="photo-file"
          ref={fileInputRef}
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          disabled={submitting}
          className="w-full font-body text-sm text-text-primary/80 file:mr-4 file:rounded-md file:border-0 file:bg-accent file:px-4 file:py-2 file:font-body file:text-sm file:font-semibold file:text-bg-primary hover:file:opacity-90 disabled:opacity-60"
        />
        {errorFor('file') !== null && (
          <p role="alert" className="mt-1 font-body text-sm text-red-400">
            {errorFor('file')}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="photo-title"
          className="mb-1 block font-body text-sm text-text-primary/80"
        >
          Título
        </label>
        <input
          id="photo-title"
          name="title"
          type="text"
          maxLength={100}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          disabled={submitting}
          className={inputClass}
          placeholder="Amanecer en los Andes"
        />
        {errorFor('title') !== null && (
          <p role="alert" className="mt-1 font-body text-sm text-red-400">
            {errorFor('title')}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="photo-category"
          className="mb-1 block font-body text-sm text-text-primary/80"
        >
          Categoría
        </label>
        <select
          id="photo-category"
          name="categoryId"
          value={form.categoryId}
          onChange={(e) =>
            setForm((f) => ({ ...f, categoryId: e.target.value }))
          }
          disabled={submitting || categories.length === 0}
          className={inputClass}
        >
          <option value="">— Selecciona una categoría —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {categories.length === 0 && (
          <p className="mt-1 font-body text-sm text-text-primary/60">
            No hay categorías. Crea una en la pestaña "Categorías" primero.
          </p>
        )}
        {errorFor('categoryId') !== null && (
          <p role="alert" className="mt-1 font-body text-sm text-red-400">
            {errorFor('categoryId')}
          </p>
        )}
      </div>

      <fieldset disabled={submitting} className="disabled:opacity-60">
        <legend className="mb-1 block font-body text-sm text-text-primary/80">
          Tamaño
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PHOTO_SIZE_ORDER.map((value) => {
            const meta = PHOTO_SIZE_META[value];
            const selected = form.size === value;
            return (
              <label
                key={value}
                className={`flex cursor-pointer flex-col items-center gap-2 rounded-md border px-3 py-3 text-center transition-colors ${
                  selected
                    ? 'border-accent bg-accent/10'
                    : 'border-accent/40 hover:bg-accent/5'
                }`}
              >
                <input
                  type="radio"
                  name="size"
                  value={value}
                  checked={selected}
                  onChange={() => setForm((f) => ({ ...f, size: value }))}
                  className="sr-only"
                />
                <GridHint size={value} />
                <span className="font-body text-xs text-text-primary/80">
                  {meta.label}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent px-6 py-2.5 font-body font-semibold text-bg-primary transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? 'Guardando…'
            : isEditing
              ? 'Guardar cambios'
              : 'Crear foto'}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={submitting}
            className="rounded-md border border-accent/40 px-6 py-2.5 font-body font-semibold text-text-primary transition-colors hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
