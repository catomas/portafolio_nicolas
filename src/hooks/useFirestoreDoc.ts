/**
 * useFirestoreDoc — Hook factory genérico para suscripción en tiempo real a un
 * Documento_Singleton de Firestore con Fallback_Estatico (Req 4).
 *
 * - Se suscribe con `onSnapshot(doc(db, path))` (Req 4.1).
 * - Resuelve el dato mediante `resolveDoc`, aplicando el fallback a orígenes
 *   inexistentes, vacíos o con lectura inicial fallida (Req 4.3, 4.6).
 * - `loading` inicia en `true` y pasa a `false` tras la primera emisión, sea
 *   snapshot o error.
 * - Ante un error posterior (suscripción ya inicializada), conserva el último
 *   dato válido mostrado sin vaciar la sección (Req 4.7).
 */
import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UseFirestoreDocOptions<T> {
  /** Ruta del documento en Firestore, p.ej. "site-content/hero". */
  path: string;
  /** Función que provee los datos de respaldo (Fallback_Estatico). */
  getFallback: () => T;
  /** Función que determina si el dato recibido debe tratarse como vacío. */
  isEmpty: (data: unknown) => boolean;
}

export interface FirestoreDocResult<T> {
  data: T;
  loading: boolean;
}

/**
 * Resolución pura y testeable del dato de un documento (Req 4.3, 4.6).
 *
 * Devuelve `getFallback()` cuando el dato es inexistente (`undefined`/`null`) o
 * `isEmpty(dato)` es verdadero; en caso contrario devuelve el dato recibido.
 */
export function resolveDoc<T>(
  snapshotData: T | undefined | null,
  isEmpty: (data: unknown) => boolean,
  getFallback: () => T,
): T {
  if (snapshotData === undefined || snapshotData === null) {
    return getFallback();
  }
  if (isEmpty(snapshotData)) {
    return getFallback();
  }
  return snapshotData;
}

/**
 * Hook que suscribe un Documento_Singleton de Firestore en tiempo real y
 * garantiza datos válidos con fallback.
 */
export function useFirestoreDoc<T>(
  options: UseFirestoreDocOptions<T>,
): FirestoreDocResult<T> {
  const { path, getFallback, isEmpty } = options;

  const [data, setData] = useState<T>(() => getFallback());
  const [loading, setLoading] = useState(true);

  // Referencias estables para evitar re-suscripciones al cambiar identidades de
  // funciones entre renders; solo `path` debe reiniciar la suscripción.
  const getFallbackRef = useRef(getFallback);
  const isEmptyRef = useRef(isEmpty);
  getFallbackRef.current = getFallback;
  isEmptyRef.current = isEmpty;

  useEffect(() => {
    // `initialized` distingue el fallo de lectura inicial (aplica fallback,
    // Req 4.3) de un error posterior (conserva el último dato válido, Req 4.7).
    let initialized = false;

    const docRef = doc(db, path);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        const snapshotData = snapshot.exists()
          ? (snapshot.data() as T)
          : undefined;
        setData(resolveDoc(snapshotData, isEmptyRef.current, getFallbackRef.current));
        initialized = true;
        setLoading(false);
      },
      () => {
        // Lectura inicial fallida → fallback (Req 4.3).
        // Error posterior → conservar el último dato válido (Req 4.7).
        if (!initialized) {
          setData(getFallbackRef.current());
          initialized = true;
        }
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [path]);

  return { data, loading };
}
