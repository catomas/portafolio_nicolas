/**
 * Script_Seed — Puebla Firestore con el contenido de `Fallback_Estatico`
 * (`src/data/siteData.ts`). (Req 13)
 *
 * Ejecutable con `npm run seed` (`tsx scripts/seed.ts`).
 *
 * Usa el SDK web (cliente) de Firebase. Como corre en Node (no en Vite), las
 * variables `VITE_FIREBASE_*` se cargan desde `.env` con `dotenv` y el
 * `firebaseConfig` se construye desde `process.env` (Req 13, design.md).
 *
 * Idempotencia (Req 13.6):
 * - Singletons: se escriben con `setDoc` (sobrescriben en cada ejecución).
 * - Colecciones (`photos`/`brands`): se escriben con IDs deterministas tomados
 *   de `siteData.ts` — `setDoc(doc(collection(db,'photos'), photo.id), {...})` —
 *   de modo que re-ejecutar no crea duplicados.
 *
 * Reglas de identidad (Req 13.5, design.md):
 * - Para `photos` y `brands`, el `id` de la entidad es `doc.id`; NO se guarda
 *   dentro del documento.
 *
 * Manejo de errores (Req 13.7):
 * - Ante un error de escritura se registra el documento/colección afectado,
 *   se continúa con las escrituras restantes y el proceso finaliza con un
 *   código de salida distinto de 0 indicando el fallo.
 *
 * Imágenes (Req 13.4): se usan las URLs de Unsplash existentes tal cual, sin
 * subir archivos a Storage.
 */
import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  type DocumentData,
} from 'firebase/firestore';
import { siteData } from '../src/data/siteData';

const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

/** Devuelve los nombres de las variables de entorno ausentes o vacías. */
function findMissingConfigVars(env: NodeJS.ProcessEnv): string[] {
  return REQUIRED_VARS.filter((name) => {
    const v = env[name];
    return v === undefined || v.trim() === '';
  });
}

const missing = findMissingConfigVars(process.env);
if (missing.length > 0) {
  console.error(
    `[seed] Faltan variables de entorno requeridas: ${missing.join(', ')}`,
  );
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Ejecuta una escritura registrando el resultado. Ante un error, lo registra
 * identificando el documento/colección afectado y devuelve `false` para que el
 * llamador contabilice el fallo sin detener el resto de escrituras (Req 13.7).
 */
async function write(label: string, op: () => Promise<void>): Promise<boolean> {
  try {
    await op();
    return true;
  } catch (err) {
    console.error(`[seed] Error al escribir "${label}":`, err);
    return false;
  }
}

async function seed(): Promise<void> {
  let singletonsWritten = 0;
  let singletonsFailed = 0;
  const collectionCounts: Record<string, number> = {};
  const collectionFailures: Record<string, number> = {};

  // --- Documentos_Singleton (Req 13.2, 13.5) ---------------------------------
  const singletons: Array<{
    label: string;
    ref: ReturnType<typeof doc>;
    data: DocumentData;
  }> = [
    {
      label: 'site-content/hero',
      ref: doc(db, 'site-content', 'hero'),
      data: siteData.hero,
    },
    {
      label: 'profile/main',
      ref: doc(db, 'profile', 'main'),
      data: siteData.about,
    },
    {
      label: 'site-config/categories',
      ref: doc(db, 'site-config', 'categories'),
      // Forma `{ categories }` según el modelo de datos (Req 6.2).
      data: { categories: siteData.categories },
    },
    {
      label: 'site-content/contact',
      ref: doc(db, 'site-content', 'contact'),
      data: siteData.contact ?? { title: 'Contacto' },
    },
    {
      label: 'site-config/gallery-style',
      ref: doc(db, 'site-config', 'gallery-style'),
      data: siteData.galleryStyle ?? { gap: 16, corners: 'rounded' },
    },
  ];

  for (const { label, ref, data } of singletons) {
    const ok = await write(label, () => setDoc(ref, data));
    if (ok) {
      singletonsWritten += 1;
    } else {
      singletonsFailed += 1;
    }
  }

  // --- Coleccion `photos` (Req 13.2, 13.5, 13.6, 15.13) ----------------------
  // ID determinista = photo.id; el campo `id` NO se guarda dentro del documento.
  //
  // Orden inicial determinista (Req 15.13): cada foto se siembra con
  //   - `order`: indice en el orden global de `siteData.photos` (0-based), y
  //   - `categoryOrder`: indice dentro de su categoria (0-based).
  // Si `siteData.ts` ya provee estos campos se respetan; de lo contrario se
  // derivan del orden de aparicion, dejando siempre un orden determinista en
  // Firestore.
  collectionCounts.photos = 0;
  collectionFailures.photos = 0;
  const photosCol = collection(db, 'photos');
  const categoryOrderCounters: Record<string, number> = {};
  let globalOrder = 0;
  for (const photo of siteData.photos) {
    const { id, ...rest } = photo;
    const derivedCategoryOrder = categoryOrderCounters[photo.categoryId] ?? 0;
    categoryOrderCounters[photo.categoryId] = derivedCategoryOrder + 1;
    const data: DocumentData = {
      ...rest,
      order: rest.order ?? globalOrder,
      categoryOrder: rest.categoryOrder ?? derivedCategoryOrder,
    };
    globalOrder += 1;
    const ok = await write(`photos/${id}`, () =>
      setDoc(doc(photosCol, id), data),
    );
    if (ok) {
      collectionCounts.photos += 1;
    } else {
      collectionFailures.photos += 1;
    }
  }

  // --- Coleccion `brands` (Req 13.2, 13.5, 13.6) -----------------------------
  // ID determinista = brand.id; el campo `id` NO se guarda dentro del documento.
  collectionCounts.brands = 0;
  collectionFailures.brands = 0;
  const brandsCol = collection(db, 'brands');
  for (const brand of siteData.brands ?? []) {
    const { id, ...rest } = brand;
    const ok = await write(`brands/${id}`, () =>
      setDoc(doc(brandsCol, id), rest),
    );
    if (ok) {
      collectionCounts.brands += 1;
    } else {
      collectionFailures.brands += 1;
    }
  }

  // --- Resumen (Req 13.3) ----------------------------------------------------
  const totalFailures =
    singletonsFailed +
    Object.values(collectionFailures).reduce((a, b) => a + b, 0);

  console.log('\n[seed] Resumen:');
  console.log(`  Singletons escritos: ${singletonsWritten}/${singletons.length}`);
  for (const name of Object.keys(collectionCounts)) {
    console.log(
      `  Coleccion "${name}": ${collectionCounts[name]} documento(s) escrito(s)` +
        (collectionFailures[name] > 0
          ? `, ${collectionFailures[name]} fallo(s)`
          : ''),
    );
  }

  if (totalFailures > 0) {
    console.error(
      `\n[seed] La ejecucion finalizo con ${totalFailures} error(es) de escritura.`,
    );
    process.exit(1);
  }

  console.log('\n[seed] Poblado completado con exito.');
}

seed().catch((err) => {
  console.error('[seed] Error inesperado durante el poblado:', err);
  process.exit(1);
});
