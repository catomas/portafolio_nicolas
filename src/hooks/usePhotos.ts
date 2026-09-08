/**
 * usePhotos — Hook de suscripción en tiempo real a la colección `photos` de
 * Firestore con Fallback_Estatico (Req 4.1, 4.3, 5.1).
 *
 * - Se suscribe con `onSnapshot(collection(db, 'photos'))` (Req 4.1).
 * - Reconstruye la identidad de cada entidad como `{ id: doc.id, ...doc.data() }`;
 *   el `id` NO se almacena dentro del documento (Req 5.1).
 * - `loading` inicia en `true` y pasa a `false` tras la primera emisión, sea
 *   snapshot o error.
 * - Colección vacía / inexistente / lectura inicial fallida → aplica el
 *   Fallback_Estatico `siteData.photos` (Req 4.3).
 * - Ante un error posterior (suscripción ya inicializada) conserva el último
 *   dato válido sin vaciar la sección (patrón consistente con useFirestoreDoc,
 *   Req 4.7).
 */
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { siteData } from '../data/siteData';
import type { Photo } from '../data/types';

export interface UsePhotosResult {
  photos: Photo[];
  loading: boolean;
}

const FALLBACK_PHOTOS: Photo[] = siteData.photos;

/**
 * Hook que suscribe la colección `photos` en tiempo real y garantiza datos
 * válidos con fallback estático.
 */
export function usePhotos(): UsePhotosResult {
  const [photos, setPhotos] = useState<Photo[]>(FALLBACK_PHOTOS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // `initialized` distingue el fallo de lectura inicial (aplica fallback,
    // Req 4.3) de un error posterior (conserva el último dato válido, Req 4.7).
    let initialized = false;

    const unsubscribe = onSnapshot(
      collection(db, 'photos'),
      (snapshot) => {
        if (snapshot.empty) {
          // Colección vacía / inexistente → fallback (Req 4.3).
          setPhotos(FALLBACK_PHOTOS);
        } else {
          setPhotos(
            snapshot.docs.map(
              (d) => ({ id: d.id, ...d.data() }) as Photo,
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
          setPhotos(FALLBACK_PHOTOS);
          initialized = true;
        }
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { photos, loading };
}
