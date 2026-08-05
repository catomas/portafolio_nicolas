import { useState, useEffect, useCallback } from 'react';

interface BrandLightboxProps {
  readonly photos: string[];
  readonly brandName: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export default function BrandLightbox({
  photos,
  brandName,
  isOpen,
  onClose,
}: BrandLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index to 0 when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
    }
  }, [isOpen]);

  const goNext = useCallback(() => {
    if (photos.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    if (photos.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  // Keyboard navigation: ← → for prev/next, Escape to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
          goNext();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goNext, goPrev]);

  // Block body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <dialog
      open
      aria-label={`Lightbox de ${brandName}`}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 w-full h-full max-w-none max-h-none m-0 p-0 border-none"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      {/* Close button */}
      <button
        type="button"
        aria-label="Cerrar lightbox"
        className="absolute top-4 right-4 z-10 text-text-primary text-3xl leading-none cursor-pointer hover:text-accent transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        ×
      </button>

      {/* Previous button */}
      <button
        type="button"
        aria-label="Foto anterior"
        className="absolute left-4 z-10 text-text-primary text-4xl leading-none cursor-pointer hover:text-accent transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          goPrev();
        }}
      >
        ‹
      </button>

      {/* Brand name title */}
      <h2
        className="text-text-primary text-xl font-semibold mb-4 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {brandName}
      </h2>

      {/* Image container - stop propagation to prevent close on image click */}
      <figure
        className="flex items-center justify-center max-w-[90vw] max-h-[80vh] m-0"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentPhoto}
          alt={`${brandName} - foto ${currentIndex + 1}`}
          className="max-w-full max-h-[80vh] object-contain"
        />
      </figure>

      {/* Next button */}
      <button
        type="button"
        aria-label="Foto siguiente"
        className="absolute right-4 z-10 text-text-primary text-4xl leading-none cursor-pointer hover:text-accent transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          goNext();
        }}
      >
        ›
      </button>
    </dialog>
  );
}
