/**
 * Limitador de intentos de login (lógica pura, Req 2.10).
 *
 * Este módulo no depende de Firebase ni de la UI: modela el estado de los
 * intentos fallidos como una lista de timestamps y expone funciones puras que
 * la `LoginPage` usa para decidir si debe bloquear nuevos envíos.
 */

/** Ventana de tiempo por defecto para el conteo de fallos: 5 minutos en ms. */
const DEFAULT_WINDOW_MS = 5 * 60_000;

/** Número de fallos por defecto que activa el bloqueo temporal. */
const DEFAULT_MAX_FAILURES = 5;

/**
 * Estado del limitador de intentos de login.
 *
 * `failures` contiene los timestamps (en ms, p.ej. `Date.now()`) de cada
 * intento de login fallido registrado.
 */
export interface ThrottleState {
  failures: number[];
}

/**
 * Registra un intento fallido agregando el timestamp `now` al estado (Req 2.10).
 *
 * Devuelve un **nuevo** estado sin mutar el original ni su arreglo `failures`.
 *
 * @param state Estado actual del limitador.
 * @param now Timestamp del fallo en ms (p.ej. `Date.now()`).
 * @returns Un nuevo `ThrottleState` con el timestamp agregado.
 */
export function registerFailure(state: ThrottleState, now: number): ThrottleState {
  return { failures: [...state.failures, now] };
}

/**
 * Indica si los intentos de login están bloqueados (Req 2.10).
 *
 * Devuelve `true` cuando hay al menos `maxFailures` fallos dentro de la ventana
 * de tiempo `[now - windowMs, now]`. Los fallos más antiguos que `now - windowMs`
 * quedan fuera de la ventana y no cuentan.
 *
 * @param state Estado actual del limitador.
 * @param now Timestamp de referencia en ms (p.ej. `Date.now()`).
 * @param windowMs Duración de la ventana en ms (por defecto 5 minutos = 300000).
 * @param maxFailures Número de fallos dentro de la ventana que activa el bloqueo (por defecto 5).
 * @returns `true` si hay ≥ `maxFailures` fallos dentro de la ventana; `false` en caso contrario.
 */
export function isLocked(
  state: ThrottleState,
  now: number,
  windowMs = DEFAULT_WINDOW_MS,
  maxFailures = DEFAULT_MAX_FAILURES,
): boolean {
  const windowStart = now - windowMs;
  const recentFailures = state.failures.filter((ts) => ts >= windowStart);
  return recentFailures.length >= maxFailures;
}
