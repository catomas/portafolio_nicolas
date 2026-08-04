import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import {
  PALETTES,
  DEFAULT_PALETTE_ID,
  STORAGE_KEY,
  type Palette,
} from '../data/palettes';

/** Valor expuesto por el PaletteContext */
export interface PaletteContextValue {
  activePaletteId: string;
  setPalette: (paletteId: string) => void;
  palettes: Palette[];
}

const PaletteContext = createContext<PaletteContextValue | null>(null);

/**
 * Hook para consumir el PaletteContext.
 * Lanza un error descriptivo si se usa fuera del PaletteProvider.
 */
export function usePaletteContext(): PaletteContextValue {
  const context = useContext(PaletteContext);
  if (context === null) {
    throw new Error(
      'usePaletteContext must be used within a PaletteProvider. ' +
        'Wrap your component tree with <PaletteProvider>.',
    );
  }
  return context;
}

/**
 * Aplica los colores de una paleta como CSS custom properties en :root.
 */
export function applyPalette(palette: Palette): void {
  const root = document.documentElement;
  const { colors } = palette;
  root.style.setProperty('--color-bg-primary', colors.bgPrimary);
  root.style.setProperty('--color-bg-secondary', colors.bgSecondary);
  root.style.setProperty('--color-text-primary', colors.textPrimary);
  root.style.setProperty('--color-accent', colors.accent);
}

/**
 * Lee localStorage y retorna un palette id válido o el default.
 */
function restoreSavedPalette(palettes: Palette[]): string {
  try {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (savedId && palettes.some((p) => p.id === savedId)) {
      return savedId;
    }
  } catch {
    // localStorage no disponible — usar default
  }
  return DEFAULT_PALETTE_ID;
}

interface PaletteProviderProps {
  readonly children: ReactNode;
}

/**
 * Provider que gestiona el estado de la paleta activa,
 * aplica CSS vars y persiste la selección en localStorage.
 */
export function PaletteProvider({ children }: PaletteProviderProps) {
  const [activePaletteId, setActivePaletteId] = useState<string>(() =>
    restoreSavedPalette(PALETTES),
  );

  // Aplicar la paleta restaurada al montar
  useEffect(() => {
    const palette = PALETTES.find((p) => p.id === activePaletteId);
    if (palette) {
      applyPalette(palette);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setPalette = useCallback((paletteId: string) => {
    const palette = PALETTES.find((p) => p.id === paletteId);
    if (!palette) return;

    setActivePaletteId(paletteId);
    applyPalette(palette);

    try {
      localStorage.setItem(STORAGE_KEY, paletteId);
    } catch {
      // localStorage no disponible — la paleta funciona solo en memoria
    }
  }, []);

  const value: PaletteContextValue = useMemo(
    () => ({
      activePaletteId,
      setPalette,
      palettes: PALETTES,
    }),
    [activePaletteId, setPalette],
  );

  return (
    <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
  );
}
