import { useMemo, useState } from 'react';
import type { AdminFormProps } from './types';
import type { Category } from '../../data/types';
import { validateCategory } from '../../lib/validation';
import { updateCategories } from '../../lib/admin';
import { useSiteData } from '../../contexts/SiteDataContext';

/**
 * CategoriesEditor — gestión CRUD de Categorias (Req 6.1, 6.3–6.9).
 *
 * Opera sobre el arreglo de categorías (`{ id, name }`) leído del
 * SiteData_Context y lo persiste completo en `site-config/categories` mediante
 * `updateCategories` (forma `{ categories }`).
 *
 * Reglas clave:
 * - Toda escritura (crear/editar/eliminar) valida con `validateCategory` antes
 *   de escribir; en caso inválido no persiste y reporta el error (Req 6.3/6.4).
 * - Al editar se pasa el `id` original como `editingId` para que el chequeo de
 *   unicidad excluya la propia entrada (Req 6.5).
 * - Antes de eliminar una categoría referenciada por una o más fotos
 *   (`photo.categoryId === category.id`) se exige confirmación explícita; el
 *   arreglo no se modifica hasta que el Admin confirma (Req 6.7).
 * - Éxito → `onFeedback('success', ...)` (Req 6.8); fallo → `onFeedback('error',
 *   ...)` identificando operación y causa (Req 6.9).
 */
export default function CategoriesEditor({ onFeedback }: AdminFormProps) {
  const { categories, photos } = useSiteData();

  // Estado del formulario de creación.
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');

  // Estado de edición en línea: id original de la categoría en edición.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editIdValue, setEditIdValue] = useState('');

  // Categoría cuya eliminación requiere confirmación (referenciada por fotos).
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Deshabilita los controles mientras hay una escritura en curso.
  const [saving, setSaving] = useState(false);

  // Conteo de fotos por categoría, para detectar referencias (Req 6.7).
  const photoCountByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const photo of photos) {
      counts.set(photo.categoryId, (counts.get(photo.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [photos]);

  /** Persiste el arreglo completo y reporta feedback (Req 6.8/6.9). */
  const persist = async (
    nextCategories: Category[],
    successMessage: string,
    operationLabel: string,
  ): Promise<boolean> => {
    setSaving(true);
    try {
      await updateCategories(nextCategories);
      onFeedback('success', successMessage);
      return true;
    } catch (error) {
      const cause = error instanceof Error ? error.message : String(error);
      onFeedback('error', `No se pudo ${operationLabel}: ${cause}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  /** Crea una categoría nueva tras validar (Req 6.3/6.4). */
  const handleCreate = async () => {
    const candidate: Category = { id: newId.trim(), name: newName.trim() };
    const result = validateCategory(candidate, categories);
    if (!result.ok) {
      onFeedback('error', result.message);
      return;
    }
    const next = [...categories, candidate];
    const okSaved = await persist(
      next,
      `Categoría "${candidate.name}" creada.`,
      'crear la categoría',
    );
    if (okSaved) {
      setNewId('');
      setNewName('');
    }
  };

  /** Inicia la edición en línea de una categoría. */
  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditIdValue(category.id);
    setEditName(category.name);
    setPendingDeleteId(null);
  };

  /** Cancela la edición en línea sin escribir. */
  const cancelEditing = () => {
    setEditingId(null);
    setEditIdValue('');
    setEditName('');
  };

  /** Guarda la edición de una categoría tras validar (Req 6.4/6.5). */
  const handleUpdate = async (originalId: string) => {
    const candidate: Category = {
      id: editIdValue.trim(),
      name: editName.trim(),
    };
    // El chequeo de unicidad excluye la propia entrada vía editingId (Req 6.5).
    const result = validateCategory(candidate, categories, originalId);
    if (!result.ok) {
      onFeedback('error', result.message);
      return;
    }
    const next = categories.map((c) =>
      c.id === originalId ? candidate : c,
    );
    const okSaved = await persist(
      next,
      `Categoría "${candidate.name}" actualizada.`,
      'actualizar la categoría',
    );
    if (okSaved) {
      cancelEditing();
    }
  };

  /**
   * Punto de entrada de eliminación. Si la categoría está referenciada por al
   * menos una foto, no elimina de inmediato: marca la eliminación como
   * pendiente de confirmación (Req 6.7). Si no está referenciada, elimina.
   */
  const requestDelete = async (category: Category) => {
    const referencedCount = photoCountByCategory.get(category.id) ?? 0;
    if (referencedCount > 0) {
      // No modificar el arreglo hasta confirmar (Req 6.7).
      setPendingDeleteId(category.id);
      return;
    }
    await performDelete(category);
  };

  /** Ejecuta la eliminación efectiva del arreglo y persiste (Req 6.6). */
  const performDelete = async (category: Category) => {
    const next = categories.filter((c) => c.id !== category.id);
    const okSaved = await persist(
      next,
      `Categoría "${category.name}" eliminada.`,
      'eliminar la categoría',
    );
    if (okSaved) {
      setPendingDeleteId(null);
      if (editingId === category.id) {
        cancelEditing();
      }
    }
  };

  return (
    <section aria-labelledby="categories-editor-heading" className="max-w-2xl">
      <h2
        id="categories-editor-heading"
        className="font-display text-lg font-bold text-text-primary"
      >
        Categorías
      </h2>
      <p className="mt-1 font-body text-sm text-text-primary/60">
        Crea, edita y elimina las categorías de la galería. El id debe ser único
        (1–50 caracteres) y el nombre no puede superar los 60 caracteres.
      </p>

      {/* Formulario de creación (Req 6.3) */}
      <form
        className="mt-6 flex flex-col gap-3 rounded-lg border border-accent/20 bg-bg-secondary/60 p-4 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          void handleCreate();
        }}
      >
        <div className="flex flex-1 flex-col gap-1">
          <label
            htmlFor="new-category-id"
            className="font-body text-xs font-semibold uppercase tracking-wide text-text-primary/70"
          >
            Id
          </label>
          <input
            id="new-category-id"
            type="text"
            value={newId}
            maxLength={50}
            onChange={(e) => setNewId(e.target.value)}
            disabled={saving}
            className="rounded-md border border-accent/30 bg-bg-primary px-3 py-2 font-body text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            placeholder="paisajes"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label
            htmlFor="new-category-name"
            className="font-body text-xs font-semibold uppercase tracking-wide text-text-primary/70"
          >
            Nombre
          </label>
          <input
            id="new-category-name"
            type="text"
            value={newName}
            maxLength={60}
            onChange={(e) => setNewName(e.target.value)}
            disabled={saving}
            className="rounded-md border border-accent/30 bg-bg-primary px-3 py-2 font-body text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            placeholder="Paisajes"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-accent px-4 py-2 font-body text-sm font-semibold text-bg-primary transition-colors hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        >
          Agregar
        </button>
      </form>

      {/* Listado de categorías */}
      <ul className="mt-6 flex flex-col gap-2">
        {categories.length === 0 && (
          <li className="font-body text-sm text-text-primary/60">
            No hay categorías todavía.
          </li>
        )}

        {categories.map((category) => {
          const isEditing = editingId === category.id;
          const isPendingDelete = pendingDeleteId === category.id;
          const referencedCount = photoCountByCategory.get(category.id) ?? 0;

          return (
            <li
              key={category.id}
              className="rounded-lg border border-accent/20 bg-bg-secondary/40 p-3"
            >
              {isEditing ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex flex-1 flex-col gap-1">
                    <label
                      htmlFor={`edit-id-${category.id}`}
                      className="font-body text-xs font-semibold uppercase tracking-wide text-text-primary/70"
                    >
                      Id
                    </label>
                    <input
                      id={`edit-id-${category.id}`}
                      type="text"
                      value={editIdValue}
                      maxLength={50}
                      onChange={(e) => setEditIdValue(e.target.value)}
                      disabled={saving}
                      className="rounded-md border border-accent/30 bg-bg-primary px-3 py-2 font-body text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <label
                      htmlFor={`edit-name-${category.id}`}
                      className="font-body text-xs font-semibold uppercase tracking-wide text-text-primary/70"
                    >
                      Nombre
                    </label>
                    <input
                      id={`edit-name-${category.id}`}
                      type="text"
                      value={editName}
                      maxLength={60}
                      onChange={(e) => setEditName(e.target.value)}
                      disabled={saving}
                      className="rounded-md border border-accent/30 bg-bg-primary px-3 py-2 font-body text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleUpdate(category.id)}
                      disabled={saving}
                      className="rounded-md bg-accent px-3 py-2 font-body text-sm font-semibold text-bg-primary transition-colors hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={saving}
                      className="rounded-md border border-accent/40 px-3 py-2 font-body text-sm font-semibold text-text-primary transition-colors hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-body text-sm font-semibold text-text-primary">
                      {category.name}
                    </p>
                    <p className="font-body text-xs text-text-primary/50">
                      id: {category.id}
                      {referencedCount > 0 && (
                        <span className="ml-2">
                          · {referencedCount}{' '}
                          {referencedCount === 1 ? 'foto' : 'fotos'}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(category)}
                      disabled={saving}
                      className="rounded-md border border-accent/40 px-3 py-1.5 font-body text-sm font-semibold text-text-primary transition-colors hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void requestDelete(category)}
                      disabled={saving}
                      className="rounded-md border border-red-500/40 px-3 py-1.5 font-body text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}

              {/* Confirmación explícita para categoría referenciada (Req 6.7) */}
              {isPendingDelete && (
                <div
                  role="alertdialog"
                  aria-labelledby={`confirm-delete-${category.id}`}
                  className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 p-3"
                >
                  <p
                    id={`confirm-delete-${category.id}`}
                    className="font-body text-sm text-red-300"
                  >
                    La categoría "{category.name}" está referenciada por{' '}
                    {referencedCount}{' '}
                    {referencedCount === 1 ? 'foto' : 'fotos'}. ¿Seguro que
                    quieres eliminarla?
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void performDelete(category)}
                      disabled={saving}
                      className="rounded-md bg-red-500 px-3 py-1.5 font-body text-sm font-semibold text-white transition-colors hover:bg-red-500/90 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(null)}
                      disabled={saving}
                      className="rounded-md border border-accent/40 px-3 py-1.5 font-body text-sm font-semibold text-text-primary transition-colors hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
