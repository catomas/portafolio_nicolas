import { useState, useEffect, useRef } from 'react';
import { usePaletteContext } from '../context/PaletteContext';

/**
 * Componente flotante que permite cambiar entre las paletas de colores.
 * Posición fija bottom-right con panel de swatches circulares.
 */
export default function PaletteSwitcher() {
  const { activePaletteId, setPalette, palettes } = usePaletteContext();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar el panel al hacer click fuera del contenedor
  useEffect(() => {
    if (!isOpen) return;

    function handleMouseDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50">
      {/* Panel de swatches — se abre hacia arriba */}
      {isOpen && (
        <div
          role="radiogroup"
          aria-label="Paletas de colores disponibles"
          className="mb-3 flex flex-col items-center gap-2 rounded-xl bg-black/80 p-2 shadow-lg backdrop-blur-sm"
        >
          {palettes.map((palette) => {
            const isActive = activePaletteId === palette.id;
            return (
              <button
                type="button"
                key={palette.id}
                role="radio"
                aria-checked={isActive}
                aria-label={palette.name}
                onClick={() => setPalette(palette.id)}
                className={`h-8 w-8 rounded-full border-2 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  isActive
                    ? 'scale-110 border-white ring-2 ring-white ring-offset-2 ring-offset-black'
                    : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: palette.colors.accent }}
              />
            );
          })}
        </div>
      )}

      {/* Botón toggle flotante */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Cambiar paleta de colores"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-black/80 text-xl shadow-lg backdrop-blur-sm transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <span aria-hidden="true">🎨</span>
      </button>
    </div>
  );
}
