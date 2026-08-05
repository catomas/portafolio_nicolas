import type { Brand } from '../data/types';
import BrandCard from './BrandCard';

interface BrandGridProps {
  readonly brands: Brand[];
  readonly onBrandClick: (brand: Brand) => void;
}

export default function BrandGrid({ brands, onBrandClick }: BrandGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {brands.map((brand) => (
        <BrandCard
          key={brand.id}
          brand={brand}
          onClick={() => onBrandClick(brand)}
        />
      ))}
    </div>
  );
}
