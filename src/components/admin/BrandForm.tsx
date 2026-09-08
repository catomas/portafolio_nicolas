import { useRef, useState, type FormEvent } from 'react';
import type { AdminFormProps } from './types';
import type { Brand } from '../../data/types';
import { useSiteData } from '../../contexts/SiteDataContext';
import { validateImageFile } from '../../lib/validation';
import { createBrand, updateBrand, deleteBrand } from '../../lib/admin';
import BrandList from './BrandList';

/** Límite de caracteres del campo `name` (Req 9.2/9.3). */
const NAME_MAX = 100;

/**
 * BrandForm + BrandList — gestión CRUD de Marcas del Panel_Admin (Req 9).
 *
 * - Lista las marcas existentes (nombre + logo) con acciones de editar/eliminar
 *   (Req 9.1). El listado se alimenta de `useSiteData().brands`, que puede
 *   llegar vacío.
 * - Crea/edita una marca con `name` (1–100 caracteres, obligatorio) y un
 *   archivo de logo validado con `validateImageFile` (Req 9.2/9.3).
 * - Validación previa a cualquier escritura: si el `name` está vacío o excede
 *   100 caracteres, o si (al crear) falta el logo, NO se llama al servicio y se
 *   muestra el error del campo, conservando el formulario (Req 9.3).
 *   En modo edición el logo es opcional: si no se sube uno nuevo se conserva el
 *   `logoUrl` existente.
 * - Orquestación subida→escritura (Req 9.6): el `logoFile` se pasa a
 *   `createBrand`/`updateBrand`, que suben el logo antes de escribir; si la
 *   subida falla, el servicio rechaza sin escribir el documento y aquí se
 *   captura para mostrar el error preservando el estado previo.
 * - Reporta éxito (Req 9.9) / error identificando operación y causa (Req 9.10)
 *   al banner de AdminPage vía `onFeedback`.
 */
export default function BrandForm({ onFeedback }: AdminFormProps) {
  const { brands } = useSiteData();

  const [name, setName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{
    field: string;
    message: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const isEditing = editingId !== null;

  const resetForm = () => {
    setName('');
    setLogoFile(null);
    setEditingId(null);
    setFieldError(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingId(brand.id);
    setName(brand.name);
    setLogoFile(null);
    setFieldError(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleLogoChange = (selected: File | null) => {
    setFieldError(null);
    if (selected) {
      // Valida tipo/tamaño del logo antes de aceptarlo (Req 9.2/9.3).
      const result = validateImageFile(selected);
      if (!result.ok) {
        setFieldError({ field: 'logo', message: result.message });
        setLogoFile(null);
        if (logoInputRef.current) {
          logoInputRef.current.value = '';
        }
        return;
      }
    }
    setLogoFile(selected);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteBrand(id);
      onFeedback('success', 'Marca eliminada correctamente.');
      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      const cause = err instanceof Error ? err.message : 'error desconocido';
      onFeedback('error', `No se pudo eliminar la marca: ${cause}.`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    setFieldError(null);

    // Validación de `name` previa a cualquier escritura (Req 9.3).
    const trimmedName = name.trim();
    if (trimmedName.length < 1) {
      setFieldError({ field: 'name', message: 'El nombre es obligatorio.' });
      return;
    }
    if (trimmedName.length > NAME_MAX) {
      setFieldError({
        field: 'name',
        message: `El nombre no puede superar los ${NAME_MAX} caracteres.`,
      });
      return;
    }

    // Al crear, el logo es obligatorio (Req 9.2/9.3). Al editar es opcional:
    // si no se sube uno nuevo se conserva el `logoUrl` existente.
    if (!isEditing && !logoFile) {
      setFieldError({
        field: 'logo',
        message: 'Debes seleccionar un archivo de logo.',
      });
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && editingId !== null) {
        await updateBrand(editingId, {
          name: trimmedName,
          logoFile: logoFile ?? undefined,
        });
        onFeedback('success', 'Marca actualizada correctamente.');
      } else {
        await createBrand({
          name: trimmedName,
          logoFile: logoFile ?? undefined,
        });
        onFeedback('success', 'Marca creada correctamente.');
      }
      resetForm();
    } catch (err) {
      // Req 9.6/9.10: si la subida del logo o la escritura falla, no se crea/
      // actualiza la marca; se identifica la operación y la causa, conservando
      // el estado del formulario.
      const operation = isEditing ? 'actualizar' : 'crear';
      const cause = err instanceof Error ? err.message : 'error desconocido';
      onFeedback('error', `No se pudo ${operation} la marca: ${cause}.`);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-md border border-accent/40 bg-bg-primary px-4 py-2 font-body text-text-primary placeholder:text-text-primary/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent transition-colors disabled:opacity-60';

  const errorFor = (field: string) =>
    fieldError?.field === field ? fieldError.message : null;

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-5 rounded-lg border border-accent/30 bg-bg-secondary p-6"
        noValidate
      >
        <h2 className="font-display text-lg font-bold text-text-primary">
          {isEditing ? 'Editar marca' : 'Nueva marca'}
        </h2>

        <div>
          <label
            htmlFor="brand-name"
            className="mb-1 block font-body text-sm text-text-primary/80"
          >
            Nombre
          </label>
          <input
            id="brand-name"
            name="name"
            type="text"
            maxLength={NAME_MAX}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            className={inputClass}
            placeholder="National Geographic"
          />
          <p className="mt-1 font-body text-xs text-text-primary/50">
            {name.length}/{NAME_MAX}
          </p>
          {errorFor('name') !== null && (
            <p role="alert" className="mt-1 font-body text-sm text-red-400">
              {errorFor('name')}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="brand-logo"
            className="mb-1 block font-body text-sm text-text-primary/80"
          >
            Logo{' '}
            {isEditing && (
              <span className="text-text-primary/50">
                (opcional; deja vacío para conservar el actual)
              </span>
            )}
          </label>
          <input
            id="brand-logo"
            ref={logoInputRef}
            name="logo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
            disabled={submitting}
            aria-invalid={errorFor('logo') !== null}
            className="w-full font-body text-sm text-text-primary/80 file:mr-4 file:rounded-md file:border-0 file:bg-accent file:px-4 file:py-2 file:font-body file:text-sm file:font-semibold file:text-bg-primary hover:file:opacity-90 disabled:opacity-60"
          />
          {logoFile !== null && (
            <p className="mt-1 font-body text-xs text-text-primary/60">
              Nuevo logo seleccionado: {logoFile.name}
            </p>
          )}
          {errorFor('logo') !== null && (
            <p role="alert" className="mt-1 font-body text-sm text-red-400">
              {errorFor('logo')}
            </p>
          )}
        </div>

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
                : 'Crear marca'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="rounded-md border border-accent/40 px-6 py-2.5 font-body font-semibold text-text-primary transition-colors hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-text-primary">
          Marcas existentes
        </h2>
        <BrandList
          brands={brands}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      </section>
    </div>
  );
}
