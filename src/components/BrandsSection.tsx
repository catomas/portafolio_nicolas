import { useState, useCallback, useRef } from 'react';
import type { Brand } from '../data/types';
import { siteData } from '../data/siteData';
import BrandMarquee from './BrandMarquee';
import BrandGrid from './BrandGrid';
import BrandPhotoGallery from './BrandPhotoGallery';

export default function BrandsSection() {
  const brands = siteData.brands;
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const handleBrandClick = useCallback((brand: Brand) => {
    if (brand.photos.length === 0) return;
    setSelectedBrand(brand);
    // Scroll suave a la sección para que se vea la galería expandida
    setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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

      {!selectedBrand && <BrandMarquee brands={brands} />}

      <div className="mt-12">
        {selectedBrand ? (
          <BrandPhotoGallery brand={selectedBrand} onBack={handleBack} />
        ) : (
          <BrandGrid brands={brands} onBrandClick={handleBrandClick} />
        )}
      </div>
    </section>
  );
}
