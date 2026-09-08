import { useEffect, useMemo, useState } from 'react';
import {
  PHOTO_SIZE_META,
  PHOTO_SIZE_ORDER,
  parseGridDimensions,
} from '../../lib/photoSizeMeta';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { AdminFormProps } from './types';
import type {
  GalleryCorners,
  GalleryStyle,
  Photo,
  PhotoSize,
} from '../../data/types';
import { useSiteData } from '../../contexts/SiteDataContext';
import { sortPhotosByOrder } from '../../lib/photoOrder';
import {
  deletePhoto,
  reorderPhotosGlobal,
  reorderPhotosInCategory,
  updateGalleryStyle,
  updatePhoto,
} from '../../lib/admin';
import { validateGalleryStyle } from '../../lib/validation';
import { useSquareGrid } from '../../hooks/useSquareGrid';
import PhotoFields from './PhotoFields';

/** Límites del espaciado en px (Req 11.1). */
const GAP_MIN = 0;
const GAP_MAX = 64;

/** Valor centinela del filtro "Todas" (sin categoría). */
const ALL = '__all__';

/** Dispositivos disponibles en el conmutador de vista previa. */
type PreviewDevice = 'mobile' | 'tablet' | 'desktop';

/**
 * Ancho máximo del contenedor de vista previa por dispositivo (px). `null`
 * significa sin restricción (ancho completo). Al restringir el ancho, el
 * `ResizeObserver` de `useSquareGrid` re-mide y recalcula las columnas según
 * los breakpoints del hook (>=1024→8, >=768→6, resto→4).
 */
const DEVICE_WIDTH: Record<PreviewDevice, number | null> = {
  mobile: 375,
  tablet: 768,
  desktop: null,
};

/** Etiquetas visibles de cada dispositivo en el conmutador. */
const DEVICE_LABEL: Record<PreviewDevice, string> = {
  mobile: 'Móvil',
  tablet: 'Tablet',
  desktop: 'Desktop',
};

/** Orden de los botones del conmutador de dispositivo. */
const DEVICE_ORDER: ReadonlyArray<PreviewDevice> = ['mobile', 'tablet', 'desktop'];

/** Opciones del selector de esquinas: exactamente dos (Req 11.2). */
const CORNER_OPTIONS: ReadonlyArray<{ value: GalleryCorners; label: string }> = [
  { value: 'square', label: 'Rectas' },
  { value: 'rounded', label: 'Redondeadas' },
];

/**
 * Clases de área en el grid por tamaño, replicando `PhotoCard.SIZE_CLASSES`.
 * Se escriben completas para que Tailwind las detecte.
 */
const SIZE_CLASSES: Record<PhotoSize, string> = {
  small: 'col-span-2 row-span-2',
  medium: 'col-span-2 row-span-4',
  wide: 'col-span-4 row-span-2',
  large: 'col-span-4 row-span-4',
  tall: 'col-span-2 row-span-6',
  extraWide: 'col-span-6 row-span-2',
  big: 'col-span-6 row-span-6',
  landscape: 'col-span-6 row-span-4',
};

/**
 * Mini-diagrama que representa cómo ocupa la foto el grid tipo mosaico,
 * derivado de `PHOTO_SIZE_META[size].grid`. Réplica compacta del `GridHint`
 * de `PhotoFields`, con celdas más pequeñas para caber en el popover.
 */
function GridHint({ size }: { size: PhotoSize }) {
  const { cols, rows } = parseGridDimensions(size);
  return (
    <span
      aria-hidden="true"
      className="grid gap-px"
      style={{
        gridTemplateColumns: `repeat(${cols}, 0.375rem)`,
        gridTemplateRows: `repeat(${rows}, 0.375rem)`,
      }}
    >
      {Array.from({ length: cols * rows }).map((_, i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-[1px] bg-accent" />
      ))}
    </span>
  );
}

/**
 * Tarjeta arrastrable del Preview_Galeria. Replica la lógica visual de
 * `PhotoCard` (mismas SIZE_CLASSES, imagen `object-cover`) pero aplica el
 * `gap`/`corners` LOCALES (no los globales de `useSiteData`) para que el
 * preview refleje los cambios sin guardar (Req 15.2, 15.3).
 *
 * Al hacer clic se SELECCIONA (sin iniciar un arrastre, gracias al
 * `activationConstraint` por distancia del `PointerSensor`), mostrando las
 * acciones "Editar" y "Eliminar" superpuestas sobre la imagen. Los botones
 * detienen la propagación del `pointerDown` para no iniciar un arrastre.
 *
 * Vía rápida de tamaño: al seleccionar aparece un botón "Tamaño" abajo a la
 * izquierda que abre un popover con los 8 tamaños. Elegir uno llama a
 * `onChangeSize` (reflow instantáneo + auto-guardado en el padre). El tamaño
 * visual se calcula desde `currentSize` (tamaño EFECTIVO ya resuelto por el
 * padre, incluyendo el optimista), no desde `photo.size`.
 *
 * El recorte redondeado (`overflow-hidden`) vive en un envoltorio INTERNO de
 * la imagen; el contenedor sortable externo NO recorta, para que el popover
 * pueda desbordar la tarjeta sin quedar truncado.
 */
function SortablePreviewCard({
  photo,
  corners,
  currentSize,
  selected,
  deleting,
  resizing,
  onSelect,
  onEdit,
  onDelete,
  onChangeSize,
}: {
  photo: Photo;
  corners: GalleryCorners;
  currentSize: PhotoSize;
  selected: boolean;
  deleting: boolean;
  resizing: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onChangeSize: (size: PhotoSize) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.id });

  const [menuOpen, setMenuOpen] = useState(false);

  const sizeClass = SIZE_CLASSES[currentSize];
  const radius = corners === 'rounded' ? '0.5rem' : '0';

  // Cerrar el menú al deseleccionar la tarjeta.
  useEffect(() => {
    if (!selected) setMenuOpen(false);
  }, [selected]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : selected ? 20 : undefined,
  };

  const stop = (e: React.PointerEvent | React.MouseEvent) =>
    e.stopPropagation();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(photo.id)}
      className={`group relative cursor-grab touch-none select-none focus:outline-none focus:ring-2 focus:ring-accent active:cursor-grabbing ${
        selected ? 'ring-2 ring-accent' : ''
      } ${sizeClass}`}
      aria-label={`Foto: ${photo.title}. Haz clic para ver acciones; arrastra para reordenar.`}
    >
      {/* Envoltorio interno que recorta la imagen (overflow-hidden aquí, no en
          el contenedor externo, para no truncar el popover de tamaño). */}
      <div
        className="relative h-full w-full overflow-hidden"
        style={{ borderRadius: radius }}
      >
        {photo.url !== '' ? (
          <img
            src={photo.url}
            alt={photo.title}
            className="h-full w-full object-cover"
            draggable={false}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-bg-primary font-body text-xs text-text-primary/50">
            Sin imagen
          </div>
        )}

        {/* Título en hover (se mantiene del diseño previo). */}
        <div
          className={`absolute inset-0 flex items-end bg-linear-to-t from-black/60 to-transparent transition-opacity duration-300 ${
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <span className="p-3 font-body text-xs text-text-primary">
            {photo.title}
          </span>
        </div>
      </div>

      {/* Acciones sobre la imagen, visibles al seleccionar (clic) — Req UX. */}
      {selected && (
        <div className="absolute right-2 top-2 flex gap-2">
          <button
            type="button"
            onPointerDown={stop}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(photo.id);
            }}
            disabled={deleting}
            aria-label={`Editar foto: ${photo.title}`}
            className="rounded-md border border-accent/40 bg-bg-secondary/90 px-3 py-1.5 font-body text-sm font-semibold text-text-primary transition-colors hover:bg-accent hover:text-bg-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            Editar
          </button>
          <button
            type="button"
            onPointerDown={stop}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(photo.id);
            }}
            disabled={deleting}
            aria-label={`Eliminar foto: ${photo.title}`}
            className="rounded-md border border-red-500/40 bg-bg-secondary/90 px-3 py-1.5 font-body text-sm font-semibold text-red-400 transition-colors hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      )}

      {/* Vía rápida de tamaño (abajo a la izquierda), visible al seleccionar. */}
      {selected && (
        <div className="absolute bottom-2 left-2">
          {menuOpen && (
            <div
              role="menu"
              onPointerDown={stop}
              onClick={stop}
              className="absolute bottom-full left-0 z-20 mb-2 w-44 rounded-md border border-accent/40 bg-bg-secondary/95 p-2 shadow-lg backdrop-blur"
            >
              <p className="mb-1 px-1 font-body text-[10px] uppercase tracking-wide text-text-primary/50">
                Tamaño
              </p>
              <div className="grid grid-cols-2 gap-1">
                {PHOTO_SIZE_ORDER.map((value) => {
                  const meta = PHOTO_SIZE_META[value];
                  const isCurrent = value === currentSize;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="menuitemradio"
                      aria-pressed={isCurrent}
                      onPointerDown={stop}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeSize(value);
                        setMenuOpen(false);
                      }}
                      className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-center transition-colors ${
                        isCurrent
                          ? 'border-accent bg-accent/10'
                          : 'border-accent/30 hover:bg-accent/5'
                      }`}
                    >
                      <GridHint size={value} />
                      <span className="font-body text-[10px] text-text-primary/80">
                        {meta.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <button
            type="button"
            onPointerDown={stop}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((open) => !open);
            }}
            disabled={deleting}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Cambiar tamaño de la foto: ${photo.title}. Tamaño actual: ${PHOTO_SIZE_META[currentSize].label}`}
            className="flex items-center gap-1.5 rounded-md border border-accent/40 bg-bg-secondary/90 px-3 py-1.5 font-body text-sm font-semibold text-text-primary transition-colors hover:bg-accent hover:text-bg-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resizing ? 'Guardando…' : `Tamaño: ${PHOTO_SIZE_META[currentSize].label}`}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * GalleryEditor — vista unificada del Editor_Galeria (Req 15.1–15.10).
 *
 * Distribución en dos columnas en la parte superior: a la izquierda el
 * formulario de creación/edición de fotos (`PhotoFields`), a la derecha los
 * controles del Estilo_Galeria (gap + esquinas). Debajo, el Preview_Galeria en
 * vivo con filtro de categorías (solo lectura) y reordenamiento por arrastre.
 *
 * Las acciones de editar/eliminar cada foto viven ahora SOBRE las imágenes del
 * preview (al hacer clic sobre una foto), no en una lista aparte. Al pulsar
 * "Editar" se carga la foto en `PhotoFields`; "Eliminar" la borra con
 * `deletePhoto`. El preview se actualiza automáticamente al cambiar
 * `useSiteData().photos`.
 *
 * Se conserva el comportamiento del estilo local (drive del preview) y el
 * reordenamiento optimista con revert en fallo (Req 15.2, 15.3, 15.6–15.10).
 */
export default function GalleryEditor({ onFeedback }: AdminFormProps) {
  const { photos, categories, galleryStyle } = useSiteData();

  // --- Estado local del estilo (drive del preview en vivo) -----------------
  const [localStyle, setLocalStyle] = useState<GalleryStyle>(galleryStyle);
  const [gapInput, setGapInput] = useState<string>(String(galleryStyle.gap));
  const [savingStyle, setSavingStyle] = useState(false);

  // Reflejar cambios del estilo persistido (p. ej. tras guardar o snapshot).
  useEffect(() => {
    setLocalStyle(galleryStyle);
    setGapInput(String(galleryStyle.gap));
  }, [galleryStyle]);

  // --- Edición / selección de fotos en el preview --------------------------
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- Cambio de tamaño rápido desde el preview (optimista) ----------------
  // `optimisticSizeById`: tamaño recién elegido que aún no se refleja en el
  // snapshot de Firestore. `resizingId`: foto cuyo cambio se está guardando.
  const [optimisticSizeById, setOptimisticSizeById] = useState<
    Record<string, PhotoSize>
  >({});
  const [resizingId, setResizingId] = useState<string | null>(null);

  // Purgar entradas optimistas cuando el snapshot persistido ya alcanzó el
  // valor elegido (evita el parpadeo de revertir al tamaño anterior antes de
  // que llegue el snapshot).
  useEffect(() => {
    setOptimisticSizeById((current) => {
      const entries = Object.entries(current);
      if (entries.length === 0) return current;
      let changed = false;
      const next: Record<string, PhotoSize> = {};
      for (const [id, size] of entries) {
        const live = photos.find((p) => p.id === id);
        // Conservar solo mientras el valor persistido aún no coincide.
        if (live && (live.size ?? 'medium') === size) {
          changed = true; // se descarta (ya alcanzó)
        } else {
          next[id] = size;
        }
      }
      return changed ? next : current;
    });
  }, [photos]);

  const editingPhoto = useMemo(
    () => photos.find((p) => p.id === editingPhotoId) ?? null,
    [photos, editingPhotoId],
  );

  // Si la foto en edición desaparece (p. ej. eliminada), limpiar el objetivo.
  useEffect(() => {
    if (editingPhotoId !== null && editingPhoto === null) {
      setEditingPhotoId(null);
    }
  }, [editingPhotoId, editingPhoto]);

  // --- Filtro de categoría (solo lectura) ----------------------------------
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL);
  const isAll = selectedCategory === ALL;

  // --- Dispositivo de la vista previa (Desktop por defecto) ----------------
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const previewMaxWidth = DEVICE_WIDTH[device];
  const isConstrained = device !== 'desktop';

  // --- Estado optimista del orden del preview ------------------------------
  const persistedOrdered = useMemo(() => {
    const relevant = isAll
      ? photos
      : photos.filter((p) => p.categoryId === selectedCategory);
    return sortPhotosByOrder(relevant, isAll ? 'global' : 'category');
  }, [photos, isAll, selectedCategory]);

  const [optimisticIds, setOptimisticIds] = useState<string[] | null>(null);

  // Al cambiar el conjunto persistido (fotos o filtro), descartar el orden
  // optimista para reflejar el estado real.
  useEffect(() => {
    setOptimisticIds(null);
  }, [persistedOrdered]);

  // Lista de fotos a mostrar en el preview, en el orden vigente.
  const previewPhotos = useMemo(() => {
    if (optimisticIds === null) return persistedOrdered;
    const byId = new Map(persistedOrdered.map((p) => [p.id, p]));
    const ordered: Photo[] = [];
    for (const id of optimisticIds) {
      const p = byId.get(id);
      if (p) ordered.push(p);
    }
    return ordered;
  }, [optimisticIds, persistedOrdered]);

  const previewIds = useMemo(
    () => previewPhotos.map((p) => p.id),
    [previewPhotos],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentIds = previewPhotos.map((p) => p.id);
    const oldIndex = currentIds.indexOf(String(active.id));
    const newIndex = currentIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const newIds = arrayMove(currentIds, oldIndex, newIndex);

    // Actualización optimista del preview (Req 15.9).
    setOptimisticIds(newIds);

    try {
      if (isAll) {
        await reorderPhotosGlobal(newIds);
      } else {
        await reorderPhotosInCategory(selectedCategory, newIds);
      }
      onFeedback('success', 'Orden de las fotos actualizado.');
    } catch (err) {
      // Revertir al último orden persistido (Req 15.10).
      setOptimisticIds(null);
      const cause = err instanceof Error ? err.message : 'error desconocido';
      onFeedback('error', `No se pudo guardar el nuevo orden: ${cause}.`);
    }
  };

  const handleSaveStyle = async () => {
    if (savingStyle) return;
    const candidate: GalleryStyle = {
      gap: Number.parseInt(gapInput, 10),
      corners: localStyle.corners,
    };
    const result = validateGalleryStyle(candidate);
    if (!result.ok) {
      onFeedback('error', result.message);
      return;
    }
    setSavingStyle(true);
    try {
      await updateGalleryStyle(candidate);
      setGapInput(String(candidate.gap));
      setLocalStyle(candidate);
      onFeedback('success', 'Estilo de galería guardado correctamente.');
    } catch (err) {
      const cause = err instanceof Error ? err.message : 'error desconocido';
      onFeedback('error', `No se pudo guardar el estilo de galería: ${cause}`);
    } finally {
      setSavingStyle(false);
    }
  };

  // --- Acciones sobre las fotos del preview --------------------------------
  const handleSelectPhoto = (id: string) => {
    setSelectedPhotoId((current) => (current === id ? null : id));
  };

  const handleEditPhoto = (id: string) => {
    setEditingPhotoId(id);
    setSelectedPhotoId(null);
    // Llevar el formulario (columna superior) a la vista.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePhoto = async (id: string) => {
    if (deletingId !== null) return;
    setDeletingId(id);
    try {
      await deletePhoto(id);
      onFeedback('success', 'Foto eliminada correctamente.');
      setSelectedPhotoId((current) => (current === id ? null : current));
      if (editingPhotoId === id) {
        setEditingPhotoId(null);
      }
    } catch (err) {
      const cause = err instanceof Error ? err.message : 'error desconocido';
      onFeedback('error', `No se pudo eliminar la foto: ${cause}.`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleChangePhotoSize = async (id: string, size: PhotoSize) => {
    const current = photos.find((p) => p.id === id);
    const effective = optimisticSizeById[id] ?? current?.size ?? 'medium';
    // Si el tamaño elegido coincide con el efectivo actual, no hacer nada.
    if (size === effective) return;

    // Reflow instantáneo (optimista) + marcar como guardando.
    setOptimisticSizeById((prev) => ({ ...prev, [id]: size }));
    setResizingId(id);

    try {
      await updatePhoto(id, { size });
      onFeedback('success', 'Tamaño actualizado.');
      // No se limpia aquí: el efecto sobre `photos` purgará la entrada cuando
      // el snapshot persistido alcance el valor elegido (evita parpadeo).
    } catch (err) {
      // Revertir el optimismo para esta foto.
      setOptimisticSizeById((prev) => {
        const { [id]: _discard, ...rest } = prev;
        void _discard;
        return rest;
      });
      const cause = err instanceof Error ? err.message : 'error desconocido';
      onFeedback('error', `No se pudo cambiar el tamaño: ${cause}.`);
    } finally {
      setResizingId(null);
    }
  };

  // Valor numérico acotado para el slider y el preview en vivo.
  const parsedGap = Number.parseInt(gapInput, 10);
  const sliderValue = Number.isNaN(parsedGap)
    ? GAP_MIN
    : Math.min(GAP_MAX, Math.max(GAP_MIN, parsedGap));

  // El gap aplicado al preview usa el valor local acotado (en vivo).
  const previewGap = sliderValue;

  // Celdas cuadradas en el preview, replicando el grid público (Req 15.x).
  const { ref: previewGridRef, gridStyle: previewGridStyle } =
    useSquareGrid(previewGap);

  const chipClass = (active: boolean) =>
    `rounded-full border px-4 py-1.5 font-body text-sm transition-colors ${
      active
        ? 'border-accent bg-accent/10 text-text-primary'
        : 'border-accent/40 bg-bg-secondary text-text-primary/70 hover:bg-accent/5'
    }`;

  return (
    <div className="space-y-10">
      {/* --------- Fila superior: formulario | estilo (dos columnas) -------- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Columna izquierda: formulario de creación/edición de fotos. */}
        <section
          aria-labelledby="gallery-photo-form-heading"
          className="rounded-lg border border-accent/30 bg-bg-secondary p-6"
        >
          <h2 id="gallery-photo-form-heading" className="sr-only">
            Formulario de foto
          </h2>
          <PhotoFields
            editingPhoto={editingPhoto}
            onSaved={() => setEditingPhotoId(null)}
            onCancelEdit={() => setEditingPhotoId(null)}
            onFeedback={onFeedback}
          />
        </section>

        {/* Columna derecha: controles del Estilo_Galeria. */}
        <section
          aria-labelledby="gallery-style-heading"
          className="rounded-lg border border-accent/30 bg-bg-secondary p-6"
        >
          <h2
            id="gallery-style-heading"
            className="font-display text-lg font-bold text-text-primary"
          >
            Estilo de galería
          </h2>
          <p className="mt-1 font-body text-sm text-text-primary/60">
            Ajusta el espaciado (0–64 px) y las esquinas. El preview de abajo se
            actualiza al instante; pulsa "Guardar estilo" para aplicarlo al
            sitio.
          </p>

          <div className="mt-6 space-y-6">
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
                  onChange={(e) => setGapInput(e.target.value)}
                  disabled={savingStyle}
                  aria-label="Espaciado entre fotos en píxeles"
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-bg-primary accent-accent disabled:opacity-60"
                />
                <input
                  id="gallery-gap-number"
                  name="gap"
                  type="number"
                  min={GAP_MIN}
                  max={GAP_MAX}
                  step={1}
                  value={gapInput}
                  onChange={(e) => setGapInput(e.target.value)}
                  disabled={savingStyle}
                  className="w-24 rounded-md border border-accent/40 bg-bg-primary px-3 py-2 font-body text-text-primary transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
                />
              </div>
              <p className="mt-1 font-body text-xs text-text-primary/50">
                Valor entero entre {GAP_MIN} y {GAP_MAX} píxeles.
              </p>
            </div>

            <fieldset disabled={savingStyle} className="space-y-2">
              <legend className="mb-1 block font-body text-sm text-text-primary/80">
                Esquinas
              </legend>
              <div className="flex gap-3">
                {CORNER_OPTIONS.map((option) => {
                  const selected = localStyle.corners === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 font-body text-sm transition-colors ${
                        selected
                          ? 'border-accent bg-accent/10 text-text-primary'
                          : 'border-accent/40 bg-bg-primary text-text-primary/70 hover:bg-accent/5'
                      } ${savingStyle ? 'opacity-60' : ''}`}
                    >
                      <input
                        type="radio"
                        name="corners"
                        value={option.value}
                        checked={selected}
                        onChange={() =>
                          setLocalStyle((s) => ({ ...s, corners: option.value }))
                        }
                        disabled={savingStyle}
                        className="accent-accent"
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <button
              type="button"
              onClick={handleSaveStyle}
              disabled={savingStyle}
              aria-busy={savingStyle}
              className="rounded-md bg-accent px-8 py-3 font-body font-semibold text-bg-primary transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingStyle ? 'Guardando...' : 'Guardar estilo'}
            </button>
          </div>
        </section>
      </div>

      {/* -------------------- Preview_Galeria + reorden --------------------- */}
      <section aria-labelledby="gallery-preview-heading" className="space-y-4">
        <div>
          <h2
            id="gallery-preview-heading"
            className="font-display text-lg font-bold text-text-primary"
          >
            Vista previa y orden
          </h2>
          <p className="mt-1 font-body text-sm text-text-primary/60">
            Haz clic en una foto para editarla, eliminarla o cambiar su tamaño
            al instante desde el botón "Tamaño". Arrástrala para reordenarla: en
            "Todas" se guarda el orden global; con una categoría seleccionada, el
            orden dentro de esa categoría. Usa el conmutador de dispositivo para
            previsualizar cómo se ve en desktop, tablet y móvil.
          </p>
        </div>

        {/* Filtro de categorías en solo lectura (chips + "Todas") — Req 15.4 */}
        <div
          role="group"
          aria-label="Filtrar por categoría"
          className="flex flex-wrap gap-2"
        >
          <button
            type="button"
            onClick={() => setSelectedCategory(ALL)}
            className={chipClass(isAll)}
            aria-pressed={isAll}
          >
            Todas
          </button>
          {categories.map((c) => {
            const active = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={chipClass(active)}
                aria-pressed={active}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Conmutador de dispositivo de la vista previa (Req UX). */}
        <div
          role="group"
          aria-label="Vista previa por dispositivo"
          className="flex flex-wrap gap-2"
        >
          {DEVICE_ORDER.map((value) => {
            const active = device === value;
            const width = DEVICE_WIDTH[value];
            const label =
              width != null
                ? `${DEVICE_LABEL[value]} (${width}px)`
                : DEVICE_LABEL[value];
            return (
              <button
                key={value}
                type="button"
                onClick={() => setDevice(value)}
                aria-pressed={active}
                className={`rounded-md border px-4 py-1.5 font-body text-sm transition-colors ${
                  active
                    ? 'border-accent bg-accent/10 text-text-primary'
                    : 'border-accent/40 bg-bg-secondary text-text-primary/70 hover:bg-accent/5'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Contenedor centrado que restringe el ancho según el dispositivo.
            El `previewGridRef` (grid interno) queda DENTRO para que su ancho
            medido coincida con el del dispositivo y `useSquareGrid` recalcule
            las columnas automáticamente al conmutar. */}
        <div
          className={`mx-auto w-full transition-[max-width] duration-300 ${
            isConstrained ? 'rounded-lg border border-accent/30 p-2' : ''
          }`}
          style={{
            maxWidth: previewMaxWidth != null ? `${previewMaxWidth}px` : undefined,
          }}
        >
          {previewPhotos.length === 0 ? (
            <p className="py-12 text-center font-body text-text-primary/60">
              No hay fotos en esta selección.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={previewIds} strategy={rectSortingStrategy}>
                <div
                  ref={previewGridRef}
                  className="grid grid-flow-dense"
                  style={previewGridStyle}
                >
                  {previewPhotos.map((photo) => {
                    const effectiveSize =
                      optimisticSizeById[photo.id] ?? photo.size ?? 'medium';
                    return (
                      <SortablePreviewCard
                        key={photo.id}
                        photo={photo}
                        corners={localStyle.corners}
                        currentSize={effectiveSize}
                        selected={selectedPhotoId === photo.id}
                        deleting={deletingId === photo.id}
                        resizing={resizingId === photo.id}
                        onSelect={handleSelectPhoto}
                        onEdit={handleEditPhoto}
                        onDelete={handleDeletePhoto}
                        onChangeSize={(size) =>
                          handleChangePhotoSize(photo.id, size)
                        }
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </section>
    </div>
  );
}
