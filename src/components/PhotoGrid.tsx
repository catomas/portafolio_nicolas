import type { Photo } from '../data/types';
import PhotoCard from './PhotoCard';
import { useSiteData } from '../contexts/SiteDataContext';
import { useSquareGrid } from '../hooks/useSquareGrid';

interface PhotoGridProps {
  readonly photos: Photo[];
  readonly onPhotoClick: (index: number) => void;
}

export default function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  const { galleryStyle } = useSiteData();
  const { ref, gridStyle } = useSquareGrid(galleryStyle.gap);

  if (photos.length === 0) {
    return (
      <p className="text-center text-text-primary/70 font-body py-12">
        No hay fotografías en esta categoría
      </p>
    );
  }

  return (
    <div ref={ref} className="grid grid-flow-dense" style={gridStyle}>
      {photos.map((photo, index) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onClick={() => onPhotoClick(index)}
        />
      ))}
    </div>
  );
}
