import { useState, useCallback } from 'react';
import type { Photo } from '../data/types';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import GallerySection from '../components/GallerySection';
import BrandsSection from '../components/BrandsSection';
import AboutSection from '../components/AboutSection';
import ContactSection from '../components/ContactSection';
import Lightbox from '../components/Lightbox';
import { PaletteProvider } from '../context/PaletteContext';
import { SiteDataProvider } from '../contexts/SiteDataContext';
import PaletteSwitcher from '../components/PaletteSwitcher';

/**
 * Sitio_Publico — layout público de la Fase 1 servido en la ruta raíz `/`
 * (Req 3.7).
 *
 * Conserva íntegramente el layout de la Fase 1 (Navbar, HeroSection,
 * GallerySection con lightbox, BrandsSection, AboutSection, ContactSection,
 * Lightbox y PaletteSwitcher) y su gestión de estado del lightbox
 * (`isOpen`, `currentPhotoIndex`, `lightboxPhotos`), extraída desde `App`.
 *
 * Se envuelve en `PaletteProvider` + `SiteDataProvider` para que el contenido
 * público lea desde Firestore con Fallback_Estatico, mientras el Panel_Admin
 * se renderiza sin este layout ni estos providers (Req 3.6).
 */
export default function PublicSite() {
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
      <SiteDataProvider>
        <Navbar />
        <HeroSection />
        <GallerySection onPhotoClick={handlePhotoClick} />
        <BrandsSection />
        <AboutSection />
        <ContactSection />
        <Lightbox
          isOpen={isOpen}
          photos={lightboxPhotos}
          currentIndex={currentPhotoIndex}
          onClose={handleLightboxClose}
          onNavigate={handleLightboxNavigate}
        />
        <PaletteSwitcher />
      </SiteDataProvider>
    </PaletteProvider>
  );
}
