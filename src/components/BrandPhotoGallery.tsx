import { useState } from 'react';
import type { Brand } from '../data/types';
import Lightbox from './Lightbox';

interface BrandPhotoGalleryProps {
  readonly brand: Brand;
  readonly onBack: () => void;
}

export default function BrandPhotoGallery({ brand, onBack }: BrandPhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div className="animate-fade-in-up">
      {/* Header con botón de volver y nombre de la marca */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-text-primary/70 hover:text-accent transition-colors cursor-pointer"
          aria-label="Volver a marcas"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-body text-sm">Volver</span>
        </button>

        <div className="flex items-center gap-3">
          <img
            src={brand.logoUrl}
            alt={`Logo de ${brand.name}`}
            className="h-8 object-contain brand-logo"
          />
          <h3 className="text-xl font-semibold text-text-primary">
            {brand.name}
          </h3>
        </div>
      </div>

      {/* Grid de fotos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {brand.photos.map((photoUrl, index) => (
          <button
            key={photoUrl}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className="group overflow-hidden rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label={`Ver foto ${index + 1} de ${brand.name}`}
          >
            <img
              src={photoUrl}
              alt={`${brand.name} - foto ${index + 1}`}
              className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Lightbox para ver foto en grande */}
      <Lightbox
        isOpen={lightboxIndex !== null}
        photos={brand.photos.map((url, i) => ({
          id: `${brand.id}-${i}`,
          url,
          title: `${brand.name} - foto ${i + 1}`,
          categoryId: '',
        }))}
        currentIndex={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
}
