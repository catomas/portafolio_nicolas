import { useEffect, useCallback } from 'react';
import type { Photo } from '../data/types';

interface LightboxProps {
  readonly isOpen: boolean;
  readonly photos: Photo[];
  readonly currentIndex: number;
  readonly onClose: () => void;
  readonly onNavigate: (newIndex: number) => void;
}

export default function Lightbox({
  isOpen,
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxProps) {
  const goNext = useCallback(() => {
    if (photos.length === 0) return;
    onNavigate((currentIndex + 1) % photos.length);
  }, [currentIndex, photos.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (photos.length === 0) return;
    onNavigate((currentIndex - 1 + photos.length) % photos.length);
  }, [currentIndex, photos.length, onNavigate]);

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
      aria-label="Lightbox de fotografía"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 w-full h-full max-w-none max-h-none m-0 p-0 border-none"
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

      {/* Image container - stop propagation to prevent close on image click */}
      <figure
        className="flex items-center justify-center max-w-[90vw] max-h-[90vh] m-0"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentPhoto.url}
          alt={currentPhoto.title}
          className="max-w-full max-h-[90vh] object-contain"
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
