import type { Brand } from '../data/types';

interface BrandCardProps {
  readonly brand: Brand;
  readonly onClick: () => void;
}

export default function BrandCard({ brand, onClick }: BrandCardProps) {
  const isDisabled = brand.photos.length === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`group overflow-hidden rounded-lg border border-accent bg-bg-secondary text-left transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-accent ${
        isDisabled
          ? 'cursor-default opacity-50'
          : 'cursor-pointer hover:scale-[1.02]'
      }`}
      aria-label={`Ver fotos de ${brand.name}`}
    >
      {/* Logo */}
      <div className="flex items-center px-4 pt-4">
        <img
          src={brand.logoUrl}
          alt={`Logo de ${brand.name}`}
          className="h-8 object-contain"
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
