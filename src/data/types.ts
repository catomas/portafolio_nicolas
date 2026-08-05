/** Categoría temática de fotografías */
export interface Category {
  id: string;
  name: string;
}

/** Fotografía individual */
export interface Photo {
  id: string;
  url: string;
  title: string;
  categoryId: string; // Referencia a Category.id
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

/** Estructura completa del archivo de datos */
export interface SiteData {
  hero: HeroData;
  categories: Category[];
  photos: Photo[];
  about: AboutData;
  brands?: Brand[];      // Marcas/clientes (opcional)
  contact?: ContactData; // Datos de contacto (opcional)
}
