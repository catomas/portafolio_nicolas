/** Colores que componen una paleta */
export interface PaletteColors {
  bgPrimary: string;
  bgSecondary: string;
  textPrimary: string;
  accent: string;
}

/** Paleta de colores del sitio */
export interface Palette {
  id: string;
  name: string;
  colors: PaletteColors;
}

/** Registro de paletas disponibles */
export const PALETTES: Palette[] = [
  {
    id: 'dark-classic',
    name: 'Dark Classic',
    colors: {
      bgPrimary: '#0a0a0a',
      bgSecondary: '#1a1a1a',
      textPrimary: '#f5f5f5',
      accent: '#d4af37',
    },
  },
  {
    id: 'warm-cream',
    name: 'Warm Cream',
    colors: {
      bgPrimary: '#fdf8f0',
      bgSecondary: '#f5ede0',
      textPrimary: '#2d2d2d',
      accent: '#c9956b',
    },
  },
  {
    id: 'neutral-gray',
    name: 'Neutral Gray',
    colors: {
      bgPrimary: '#2a2a2a',
      bgSecondary: '#3a3a3a',
      textPrimary: '#e0e0e0',
      accent: '#c2b280',
    },
  },
  {
    id: 'clean-white',
    name: 'Clean White',
    colors: {
      bgPrimary: '#ffffff',
      bgSecondary: '#f8f8f8',
      textPrimary: '#1a1a1a',
      accent: '#333333',
    },
  },
];

/** ID de la paleta por defecto */
export const DEFAULT_PALETTE_ID = 'dark-classic';

/** Clave de localStorage para persistir la selección */
export const STORAGE_KEY = 'selected-palette';
