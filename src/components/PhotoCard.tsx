import type { Photo, PhotoSize } from '../data/types';
import { useSiteData } from '../contexts/SiteDataContext';

interface PhotoCardProps {
  readonly photo: Photo;
  readonly onClick: () => void;
}

/**
 * Cada tamaño define cuántas columnas y filas ocupa la foto en el grid.
 * Las clases están escritas completas para que Tailwind las detecte.
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

export default function PhotoCard({ photo, onClick }: PhotoCardProps) {
  const { galleryStyle } = useSiteData();
  const sizeClass = SIZE_CLASSES[photo.size ?? 'medium'];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent ${sizeClass}`}
      style={{
        borderRadius: galleryStyle.corners === 'rounded' ? '0.5rem' : '0',
      }}
      aria-label={`Ver foto: ${photo.title}`}
    >
      <img
        src={photo.url}
        alt={photo.title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      {/* Title overlay on hover */}
      <div className="absolute inset-0 flex items-end bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="p-4 font-body text-sm text-text-primary">
          {photo.title}
        </span>
      </div>
    </button>
  );
}
