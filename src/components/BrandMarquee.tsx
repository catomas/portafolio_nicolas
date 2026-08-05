import type { Brand } from '../data/types';

interface BrandMarqueeProps {
  readonly brands: Brand[];
}

export default function BrandMarquee({ brands }: BrandMarqueeProps) {
  if (brands.length === 0) return null;

  // Duplicar logos para crear loop infinito
  const duplicatedBrands = [...brands, ...brands];

  return (
    <div className="overflow-hidden bg-bg-secondary py-6 rounded-lg">
      <div className="marquee-track">
        {duplicatedBrands.map((brand, index) => (
          <img
            key={`${brand.id}-${index}`}
            src={brand.logoUrl}
            alt={brand.name}
            className="h-12 max-h-12 object-contain mx-8"
          />
        ))}
      </div>
    </div>
  );
}
