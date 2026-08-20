import { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Brand } from '../data/types';
import { siteData } from '../data/siteData';
import BrandMarquee from './BrandMarquee';
import BrandPhotoGallery from './BrandPhotoGallery';

export default function BrandsSection() {
  const brands = siteData.brands;
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const handleBrandClick = useCallback((brand: Brand) => {
    if (brand.photos.length === 0) return;
    setSelectedBrand(brand);
    setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedBrand(null);
  }, []);

  if (!brands || brands.length === 0) return null;

  return (
    <section id="brands" ref={sectionRef} className="px-6 py-16 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-text-primary mb-10 text-center">
        Marcas
      </h2>

      <AnimatePresence mode="wait">
        {selectedBrand ? (
          <motion.div
            key="gallery"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <BrandPhotoGallery brand={selectedBrand} onBack={handleBack} />
          </motion.div>
        ) : (
          <motion.div
            key="brands-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BrandMarquee brands={brands} />

            {/* Grid de marcas con animación individual por tarjeta */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {brands.map((brand, index) => (
                <motion.div
                  key={brand.id}
                  layout
                  initial={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  // Al salir, las tarjetas se comprimen hacia el centro
                  exit={{
                    opacity: 0,
                    scale: 0.6,
                    y: -20,
                    transition: {
                      duration: 0.3,
                      delay: index * 0.05, // escalonado
                    },
                  }}
                >
                  <BrandCardButton brand={brand} onClick={() => handleBrandClick(brand)} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/** Tarjeta de marca como botón clickeable */
function BrandCardButton({ brand, onClick }: { brand: Brand; onClick: () => void }) {
  const isDisabled = brand.photos.length === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`group w-full overflow-hidden rounded-lg border border-accent bg-bg-secondary text-left transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-accent ${
        isDisabled
          ? 'cursor-default opacity-50'
          : 'cursor-pointer'
      }`}
      aria-label={`Ver fotos de ${brand.name}`}
    >
      {/* Logo */}
      <div className="flex items-center px-4 pt-4">
        <img
          src={brand.logoUrl}
          alt={`Logo de ${brand.name}`}
          className="h-8 object-contain brand-logo"
          loading="lazy"
        />
      </div>

      {/* Cover photo */}
      <div className="mt-3 px-4">
        <img
          src={brand.coverPhotoUrl}
          alt={`Portada de ${brand.name}`}
          className="w-full rounded object-cover aspect-video"
          loading="lazy"
        />
      </div>

      {/* Brand name */}
      <div className="px-4 py-3">
        <span className="font-body text-sm text-text-primary">
          {brand.name}
        </span>
      </div>
    </button>
  );
}
