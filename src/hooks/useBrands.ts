/**
 * useBrands — Hook de suscripción en tiempo real a la colección `brands` de
 * Firestore con Fallback_Estatico (Req 4.1, 4.3, 9.7).
 *
 * - Se suscribe con `onSnapshot(collection(db, 'brands'))` (Req 4.1).
 * - Reconstruye la identidad de cada entidad como `{ id: doc.id, ...doc.data() }`;
 *   el `id` NO se almacena dentro del documento.
 * - `loading` inicia en `true` y pasa a `false` tras la primera emisión, sea
 *   snapshot o error.
 * - Colección vacía / inexistente / lectura inicial fallida → aplica el
 *   Fallback_Estatico `siteData.brands` (o `[]` si es indefinido) (Req 4.3, 9.7).
 * - Ante un error posterior (suscripción ya inicializada) conserva el último
 *   dato válido sin vaciar la sección (patrón consistente con useFirestoreDoc,
 *   Req 4.7).
 */
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { siteData } from '../data/siteData';
import type { Brand } from '../data/types';

export interface UseBrandsResult {
  brands: Brand[];
  loading: boolean;
}

// `siteData.brands` es opcional en SiteData; se normaliza a `[]` cuando falta.
const FALLBACK_BRANDS: Brand[] = siteData.brands ?? [];

/**
 * Hook que suscribe la colección `brands` en tiempo real y garantiza datos
 * válidos con fallback estático.
 */
export function useBrands(): UseBrandsResult {
  const [brands, setBrands] = useState<Brand[]>(FALLBACK_BRANDS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // `initialized` distingue el fallo de lectura inicial (aplica fallback,
    // Req 4.3) de un error posterior (conserva el último dato válido, Req 4.7).
    let initialized = false;

    const unsubscribe = onSnapshot(
      collection(db, 'brands'),
      (snapshot) => {
        if (snapshot.empty) {
          // Colección vacía / inexistente → fallback (Req 4.3, 9.7).
          setBrands(FALLBACK_BRANDS);
        } else {
          setBrands(
            snapshot.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as Brand,
            ),
          );
        }
        initialized = true;
        setLoading(false);
      },
      () => {
        // Lectura inicial fallida → fallback (Req 4.3).
        // Error posterior → conservar el último dato válido (Req 4.7).
        if (!initialized) {
          setBrands(FALLBACK_BRANDS);
          initialized = true;
        }
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { brands, loading };
}
