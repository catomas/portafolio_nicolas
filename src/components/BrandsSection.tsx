import { useState, useCallback } from 'react';
import type { Brand } from '../data/types';
import { siteData } from '../data/siteData';
import BrandMarquee from './BrandMarquee';
import BrandGrid from './BrandGrid';
import BrandLightbox from './BrandLightbox';

export default function BrandsSection() {
  const brands = siteData.brands;

  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleBrandClick = useCallback((brand: Brand) => {
    if (brand.photos.length === 0) return;
    setSelectedBrand(brand);
    setIsLightboxOpen(true);
  }, []);

  const handleLightboxClose = useCallback(() => {
    setIsLightboxOpen(false);
    setSelectedBrand(null);
  }, []);

  // Si no hay marcas, no renderizar nada
  if (!brands || brands.length === 0) return null;

  return (
    <section id="brands" className="px-6 py-16 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-text-primary mb-10 text-center">
        Marcas
      </h2>

      <BrandMarquee brands={brands} />

      <div className="mt-12">
        <BrandGrid brands={brands} onBrandClick={handleBrandClick} />
      </div>

      <BrandLightbox
        photos={selectedBrand?.photos ?? []}
        brandName={selectedBrand?.name ?? ''}
        isOpen={isLightboxOpen}
        onClose={handleLightboxClose}
      />
    </section>
  );
}
