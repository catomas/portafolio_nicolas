import { useState, useMemo } from 'react';
import { siteData } from '../data/siteData';
import type { Photo } from '../data/types';
import CategoryFilter from './CategoryFilter';
import PhotoGrid from './PhotoGrid';

interface GallerySectionProps {
  readonly onPhotoClick: (index: number, photos: Photo[]) => void;
}

export default function GallerySection({ onPhotoClick }: GallerySectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredPhotos = useMemo(() => {
    if (activeCategory === 'all') {
      return siteData.photos;
    }
    return siteData.photos.filter(
      (photo) => photo.categoryId === activeCategory
    );
  }, [activeCategory]);

  const handlePhotoClick = (index: number) => {
    onPhotoClick(index, filteredPhotos);
  };

  return (
    <section id="gallery" className="px-6 py-16 md:px-12 lg:px-20 bg-bg-primary">
      <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary text-center mb-10">
        Galería
      </h2>
      <CategoryFilter
        categories={siteData.categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <PhotoGrid photos={filteredPhotos} onPhotoClick={handlePhotoClick} />
    </section>
  );
}
