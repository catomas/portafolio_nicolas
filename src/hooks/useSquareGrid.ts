import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Breakpoints de columnas (más granularidad para que los tamaños que ocupan
 * varias columnas —p. ej. 3×3 vs 3×2— dejen espacio a los lados y se
 * distingan claramente entre sí):
 * - base (< 768px): 4 columnas
 * - md (>= 768px): 6 columnas
 * - lg (>= 1024px): 8 columnas
 */
function columnsForWidth(width: number): number {
  if (width >= 1024) return 8;
  if (width >= 768) return 6;
  return 4;
}

/**
 * `useSquareGrid` mide el ancho real del contenedor del grid mediante un
 * `ResizeObserver` y devuelve un `gridStyle` que produce CELDAS CUADRADAS: el
 * alto de cada fila (`gridAutoRows`) se iguala al ancho de columna calculado a
 * partir del ancho medido, el número de columnas activo y el `gap`.
 *
 * El número de columnas se deriva del mismo ancho medido usando los breakpoints
 * de Tailwind, y las columnas se generan por estilo inline
 * (`gridTemplateColumns: repeat(cols, minmax(0, 1fr))`) para garantizar que el
 * conteo de columnas y el alto de fila SIEMPRE coincidan.
 *
 * @param gap Espaciado entre celdas en píxeles (se usa tanto en `gap` como en
 *   el cálculo del ancho de columna).
 */
export function useSquareGrid(gap: number): {
  ref: React.RefObject<HTMLDivElement | null>;
  gridStyle: React.CSSProperties;
} {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Medida inicial síncrona para evitar un primer render con celdas mal
    // proporcionadas.
    setWidth(el.clientWidth);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  // Fallback ante entornos sin medida (SSR / ancho 0): usar innerWidth si está
  // disponible para elegir un conteo de columnas razonable.
  useEffect(() => {
    if (width === 0 && typeof window !== 'undefined' && ref.current) {
      setWidth(ref.current.clientWidth);
    }
  }, [width]);

  const cols = width > 0 ? columnsForWidth(width) : 4;

  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gap: `${gap}px`,
  };

  if (width > 0) {
    const columnWidth = (width - gap * (cols - 1)) / cols;
    gridStyle.gridAutoRows = `${columnWidth}px`;
  }

  return { ref, gridStyle };
}
