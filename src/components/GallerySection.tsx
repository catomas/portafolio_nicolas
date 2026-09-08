import { useState, useMemo } from 'react';
import { useSiteData } from '../contexts/SiteDataContext';
import type { Photo } from '../data/types';
import { sortPhotosByOrder } from '../lib/photoOrder';
import CategoryFilter from './CategoryFilter';
import PhotoGrid from './PhotoGrid';

interface GallerySectionProps {
  readonly onPhotoClick: (index: number, photos: Photo[]) => void;
}

export default function GallerySection({ onPhotoClick }: GallerySectionProps) {
  const { categories, photos } = useSiteData();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredPhotos = useMemo(() => {
    // Sin filtro de categoría: ordenar todas las Fotos por `order` global (Req 15.11).
    if (activeCategory === 'all') {
      return sortPhotosByOrder(photos, 'global');
    }
    // Con una categoría seleccionada: filtrar y ordenar por `categoryOrder` (Req 15.12).
    // Las Fotos sin orden quedan al final de forma determinista (Req 15.13),
    // gestionado por sortPhotosByOrder.
    const inCategory = photos.filter(
      (photo) => photo.categoryId === activeCategory
    );
    return sortPhotosByOrder(inCategory, 'category');
  }, [activeCategory, photos]);

  const handlePhotoClick = (index: number) => {
    onPhotoClick(index, filteredPhotos);
  };

  return (
    <section id="gallery" className="px-6 py-16 md:px-12 lg:px-20 bg-bg-primary">
      <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary text-center mb-10">
        Galería
      </h2>
      <CategoryFilter
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <PhotoGrid photos={filteredPhotos} onPhotoClick={handlePhotoClick} />
    </section>
  );
}
