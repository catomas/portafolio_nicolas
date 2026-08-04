import type { Photo } from '../data/types';
import PhotoCard from './PhotoCard';

interface PhotoGridProps {
  readonly photos: Photo[];
  readonly onPhotoClick: (index: number) => void;
}

export default function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <p className="text-center text-text-primary/70 font-body py-12">
        No hay fotografías en esta categoría
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
