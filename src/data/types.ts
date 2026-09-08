/** Categoría temática de fotografías */
export interface Category {
  id: string;
  name: string;
}

/** Tamaño de la foto en el grid tipo mosaico */
export type PhotoSize =
  | 'small'
  | 'medium'
  | 'large'
  | 'wide'
  | 'tall'
  | 'extraWide'
  | 'big'
  | 'landscape';

/** Fotografía individual */
export interface Photo {
  id: string;
  url: string;
  title: string;
  categoryId: string; // Referencia a Category.id
  size?: PhotoSize; // Tamaño en el grid (default: 'medium')
  order?: number; // Posición en el orden global de fotos (0-based)
  categoryOrder?: number; // Posición dentro de su categoría (0-based)
}

/** Datos del Hero */
export interface HeroData {
  name: string;
  subtitle: string;
  backgroundUrl: string;
}

/** Red social */
export interface SocialLink {
  platform: string;
  url: string;
}

/** Marca/cliente con la que el fotógrafo ha trabajado */
export interface Brand {
  id: string;
  name: string;
  logoUrl: string;
  coverPhotoUrl: string;
  photos: string[]; // URLs de fotos del proyecto
}

/** Datos de la sección de contacto */
export interface ContactData {
  title: string;
  subtitle?: string;
}

/** Datos de la sección About */
export interface AboutData {
  bio: string;
  photographerPhotoUrl?: string; // Foto del fotógrafo
  socialLinks: SocialLink[];
}

/** Estilo de esquinas de las tarjetas de la galería */
export type GalleryCorners = 'square' | 'rounded';

/** Configuración de presentación de la galería */
export interface GalleryStyle {
  gap: number; // espaciado entre fotos en px, entero en [0, 64]
  corners: GalleryCorners;
}

/** Estructura completa del archivo de datos */
export interface SiteData {
  hero: HeroData;
  categories: Category[];
  photos: Photo[];
  about: AboutData;
  brands?: Brand[];              // Marcas/clientes (opcional)
  contact?: ContactData;         // Datos de contacto (opcional)
  galleryStyle?: GalleryStyle;   // Estilo de la galería (opcional, nuevo)
}
