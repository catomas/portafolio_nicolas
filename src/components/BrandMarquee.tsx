import { useRef, useState, useEffect, useCallback } from 'react';
import type { Brand } from '../data/types';

interface BrandMarqueeProps {
  readonly brands: Brand[];
}

/**
 * Marquee infinito que calcula dinámicamente cuántas copias del contenido
 * se necesitan para llenar el viewport sin gaps.
 */
export default function BrandMarquee({ brands }: BrandMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);

  const calculateCopies = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const contentWidth = contentRef.current.offsetWidth;
    if (contentWidth === 0) return;
    // Necesitamos suficientes copias para que al menos 2x el ancho del container esté cubierto
    const needed = Math.ceil((containerWidth * 2) / contentWidth) + 1;
    setCopies(Math.max(2, needed));
  }, []);

  useEffect(() => {
    calculateCopies();
    window.addEventListener('resize', calculateCopies);
    return () => window.removeEventListener('resize', calculateCopies);
  }, [calculateCopies, brands]);

  if (brands.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="overflow-hidden bg-bg-secondary py-6 rounded-lg"
    >
      <div
        className="marquee-track"
        style={{ '--marquee-copies': copies } as React.CSSProperties}
      >
        {Array.from({ length: copies }).map((_, copyIndex) => (
          <div
            key={copyIndex}
            ref={copyIndex === 0 ? contentRef : undefined}
            className="flex shrink-0 items-center"
          >
            {brands.map((brand) => (
              <img
                key={brand.id}
                src={brand.logoUrl}
                alt={brand.name}
                className="h-12 max-h-12 object-contain mx-10 brand-logo shrink-0"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
