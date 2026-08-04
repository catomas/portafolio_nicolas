import { useState, useCallback } from 'react';
import type { Photo } from './data/types';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import GallerySection from './components/GallerySection';
import AboutSection from './components/AboutSection';
import Lightbox from './components/Lightbox';
import { PaletteProvider } from './context/PaletteContext';
import PaletteSwitcher from './components/PaletteSwitcher';

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [lightboxPhotos, setLightboxPhotos] = useState<Photo[]>([]);

  const handlePhotoClick = useCallback((index: number, photos: Photo[]) => {
    setLightboxPhotos(photos);
    setCurrentPhotoIndex(index);
    setIsOpen(true);
  }, []);

  const handleLightboxClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleLightboxNavigate = useCallback((newIndex: number) => {
    setCurrentPhotoIndex(newIndex);
  }, []);

  return (
    <PaletteProvider>
      <Navbar />
      <HeroSection />
      <GallerySection onPhotoClick={handlePhotoClick} />
      <AboutSection />
      <Lightbox
        isOpen={isOpen}
        photos={lightboxPhotos}
        currentIndex={currentPhotoIndex}
        onClose={handleLightboxClose}
        onNavigate={handleLightboxNavigate}
      />
      <PaletteSwitcher />
    </PaletteProvider>
  );
}
