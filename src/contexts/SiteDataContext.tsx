/**
 * SiteData_Context — Contexto de datos del Sitio_Publico (Req 4, 11.7, 11.8).
 *
 * Compone los hooks de lectura reactiva con Fallback_Estatico:
 * - `useFirestoreDoc` para los Documentos_Singleton: hero (`site-content/hero`),
 *   about (`profile/main`), contact (`site-content/contact`),
 *   categories (`site-config/categories`) y gallery-style
 *   (`site-config/gallery-style`).
 * - `usePhotos` y `useBrands` para las Colecciones_Multi_Documento.
 *
 * Comportamiento de carga:
 * - El `loading` global es la disyunción (OR lógico) de los `loading`
 *   individuales: mientras algún origen no haya emitido su primera respuesta,
 *   se muestra un indicador de carga en lugar de contenido parcial o de
 *   respaldo, evitando el "flash de fallback" (Req 4.5).
 * - Al recibir todas las primeras respuestas, se renderiza el contenido
 *   resuelto; cada hook ya aplica el Fallback_Estatico solo a los orígenes
 *   inexistentes/vacíos/fallidos (Req 4.6).
 *
 * `useSiteData()` expone contenido garantizado (nunca `undefined`) y lanza un
 * error si se usa fuera del provider.
 */
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { usePhotos } from '../hooks/usePhotos';
import { useBrands } from '../hooks/useBrands';
import { siteData } from '../data/siteData';
import type {
  HeroData,
  AboutData,
  ContactData,
  Category,
  GalleryStyle,
  SectionTitles,
  Photo,
  Brand,
} from '../data/types';

/** Valor expuesto por el SiteData_Context (Req 4). */
export interface SiteDataContextValue {
  hero: HeroData;
  categories: Category[];
  photos: Photo[];
  about: AboutData;
  brands: Brand[];
  contact: ContactData;
  galleryStyle: GalleryStyle;
  sections: SectionTitles;
}

const SiteDataContext = createContext<SiteDataContextValue | null>(null);

/**
 * Hook para consumir el SiteData_Context.
 * Lanza un error descriptivo si se usa fuera del SiteDataProvider.
 */
export function useSiteData(): SiteDataContextValue {
  const context = useContext(SiteDataContext);
  if (context === null) {
    throw new Error(
      'useSiteData must be used within a SiteDataProvider. ' +
        'Wrap your component tree with <SiteDataProvider>.',
    );
  }
  return context;
}

// --- Fallbacks normalizados del Fallback_Estatico -------------------------
// `brands`, `contact` y `galleryStyle` son opcionales en SiteData; se
// normalizan aquí para garantizar valores no indefinidos (Req 11.8).
const FALLBACK_HERO: HeroData = siteData.hero;
const FALLBACK_ABOUT: AboutData = siteData.about;
const FALLBACK_CONTACT: ContactData = siteData.contact ?? { title: 'Contacto' };
const FALLBACK_CATEGORIES: Category[] = siteData.categories;
const FALLBACK_GALLERY_STYLE: GalleryStyle =
  siteData.galleryStyle ?? { gap: 16, corners: 'rounded' };
const FALLBACK_SECTIONS: SectionTitles =
  siteData.sections ?? { gallery: 'Galería', brands: 'Marcas' };

/** Forma del Documento_Singleton `site-config/categories`. */
interface CategoriesDoc {
  categories: Category[];
}

interface SiteDataProviderProps {
  readonly children: ReactNode;
}

/**
 * Provider que precarga y provee el contenido del Sitio_Publico.
 *
 * Compone los hooks de lectura y bloquea el render de children hasta que todos
 * los orígenes hayan emitido su primera respuesta (Req 4.5).
 */
export function SiteDataProvider({ children }: SiteDataProviderProps) {
  const hero = useFirestoreDoc<HeroData>({
    path: 'site-content/hero',
    getFallback: () => FALLBACK_HERO,
    // Vacío si falta el objeto o carecen `name` y `backgroundUrl`.
    isEmpty: (data) => {
      const d = data as Partial<HeroData> | null | undefined;
      if (!d || typeof d !== 'object') return true;
      const hasName = typeof d.name === 'string' && d.name.trim() !== '';
      const hasBackground =
        typeof d.backgroundUrl === 'string' && d.backgroundUrl.trim() !== '';
      return !hasName && !hasBackground;
    },
  });

  const about = useFirestoreDoc<AboutData>({
    path: 'profile/main',
    getFallback: () => FALLBACK_ABOUT,
    // Vacío si falta el objeto o la `bio`.
    isEmpty: (data) => {
      const d = data as Partial<AboutData> | null | undefined;
      if (!d || typeof d !== 'object') return true;
      return typeof d.bio !== 'string' || d.bio.trim() === '';
    },
  });

  const contact = useFirestoreDoc<ContactData>({
    path: 'site-content/contact',
    getFallback: () => FALLBACK_CONTACT,
    // Vacío si falta el objeto o el `title`.
    isEmpty: (data) => {
      const d = data as Partial<ContactData> | null | undefined;
      if (!d || typeof d !== 'object') return true;
      return typeof d.title !== 'string' || d.title.trim() === '';
    },
  });

  const categories = useFirestoreDoc<CategoriesDoc>({
    path: 'site-config/categories',
    getFallback: () => ({ categories: FALLBACK_CATEGORIES }),
    // Vacío si falta el objeto o el arreglo `categories` está ausente/vacío.
    isEmpty: (data) => {
      const d = data as Partial<CategoriesDoc> | null | undefined;
      if (!d || typeof d !== 'object') return true;
      return !Array.isArray(d.categories) || d.categories.length === 0;
    },
  });

  const galleryStyle = useFirestoreDoc<GalleryStyle>({
    path: 'site-config/gallery-style',
    getFallback: () => FALLBACK_GALLERY_STYLE,
    // Vacío si falta el objeto o carecen `gap`/`corners` (Req 11.8).
    isEmpty: (data) => {
      const d = data as Partial<GalleryStyle> | null | undefined;
      if (!d || typeof d !== 'object') return true;
      return typeof d.gap !== 'number' || typeof d.corners !== 'string';
    },
  });

  const sections = useFirestoreDoc<SectionTitles>({
    path: 'site-content/sections',
    getFallback: () => FALLBACK_SECTIONS,
    // Vacío si falta el objeto o carecen tanto `gallery` como `brands`.
    isEmpty: (data) => {
      const d = data as Partial<SectionTitles> | null | undefined;
      if (!d || typeof d !== 'object') return true;
      const hasGallery =
        typeof d.gallery === 'string' && d.gallery.trim() !== '';
      const hasBrands =
        typeof d.brands === 'string' && d.brands.trim() !== '';
      return !hasGallery && !hasBrands;
    },
  });

  const { photos, loading: photosLoading } = usePhotos();
  const { brands, loading: brandsLoading } = useBrands();

  // Loading global = disyunción (OR) de los loading individuales (Req 4.5).
  const loading =
    hero.loading ||
    about.loading ||
    contact.loading ||
    categories.loading ||
    galleryStyle.loading ||
    sections.loading ||
    photosLoading ||
    brandsLoading;

  const value: SiteDataContextValue = useMemo(
    () => ({
      hero: hero.data,
      categories: categories.data.categories,
      photos,
      about: about.data,
      brands,
      contact: contact.data,
      galleryStyle: galleryStyle.data,
      sections: sections.data,
    }),
    [
      hero.data,
      categories.data,
      photos,
      about.data,
      brands,
      contact.data,
      galleryStyle.data,
      sections.data,
    ],
  );

  // Req 4.5: mientras algún origen no haya emitido su primera respuesta,
  // mostrar un spinner en lugar de contenido parcial o de respaldo.
  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-neutral-950"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-700 border-t-white"
          aria-hidden="true"
        />
        <span className="sr-only">Cargando…</span>
      </div>
    );
  }

  return (
    <SiteDataContext.Provider value={value}>
      {children}
    </SiteDataContext.Provider>
  );
}
