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

/** Datos de la sección About */
export interface AboutData {
  bio: string;
  socialLinks: SocialLink[];
}

/** Estructura completa del archivo de datos */
export interface SiteData {
  hero: HeroData;
  categories: Category[];
  photos: Photo[];
  about: AboutData;
}
