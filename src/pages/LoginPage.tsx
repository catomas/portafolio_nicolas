import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  isLocked,
  registerFailure,
  type ThrottleState,
} from '../lib/loginThrottle';

/** Mensaje mostrado ante credenciales inválidas (Req 2.3). */
const INVALID_CREDENTIALS_MESSAGE = 'Credenciales incorrectas.';

/** Mensaje mostrado durante el bloqueo temporal por exceso de intentos (Req 2.10). */
const LOCKED_MESSAGE =
  'Demasiados intentos fallidos. Inténtalo de nuevo en unos minutos.';

/**
 * Página de login del Panel_Admin (Req 2, 3.5).
 *
 * - Formulario email/password; deshabilita el botón mientras el login está en
 *   curso para evitar envíos duplicados (Req 2.9).
 * - Credenciales inválidas → muestra un mensaje de error, permanece en
 *   `/admin/login` (no navega) y conserva el email introducido (Req 2.3).
 * - Si ya existe una sesión autenticada, redirige a `/admin` (Req 3.5).
 * - Integra `loginThrottle`: tras 5 intentos fallidos dentro de 5 minutos
 *   bloquea nuevos envíos y muestra un mensaje de bloqueo temporal (Req 2.10).
 */
export default function LoginPage() {
  const { user, loading, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [throttle, setThrottle] = useState<ThrottleState>({ failures: [] });

  // Req 3.5: si ya hay sesión autenticada, redirigir al panel.
  // Esperamos a que el estado de auth quede resuelto para no redirigir de forma
  // prematura mientras se determina la sesión.
  if (!loading && user) {
    return <Navigate to="/admin" replace />;
  }

  const locked = isLocked(throttle, Date.now());

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Req 2.10: si está bloqueado, no permitir nuevos envíos.
    if (isLocked(throttle, Date.now())) {
      setError(LOCKED_MESSAGE);
      return;
    }

    // Req 2.9: evitar envíos duplicados mientras hay uno en curso.
    if (submitting) {
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      // En caso de éxito, el cambio de `user` provoca la redirección a /admin
      // mediante el <Navigate> de arriba en el siguiente render (Req 2.2).
    } catch {
      // Req 2.3: credenciales inválidas → mensaje de error, permanecer en la
      // página (no navegar) y conservar el email introducido (no se limpia).
      const nextThrottle = registerFailure(throttle, Date.now());
      setThrottle(nextThrottle);

      // Req 2.10: si el fallo activa el bloqueo, mostrar el mensaje de bloqueo.
      if (isLocked(nextThrottle, Date.now())) {
        setError(LOCKED_MESSAGE);
      } else {
        setError(INVALID_CREDENTIALS_MESSAGE);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // El botón se deshabilita mientras el login está en curso (Req 2.9) y cuando
  // los intentos están bloqueados temporalmente (Req 2.10).
  const disabled = submitting || locked;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-lg border border-accent/30 bg-bg-secondary p-8"
        noValidate
      >
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Panel de administración
        </h1>

        <div>
          <label
            htmlFor="login-email"
            className="mb-1 block font-body text-sm text-text-primary/80"
          >
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            className="w-full rounded-md border border-accent/40 bg-bg-primary px-4 py-2 font-body text-text-primary placeholder:text-text-primary/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent transition-colors disabled:opacity-60"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-1 block font-body text-sm text-text-primary/80"
          >
            Contraseña
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            className="w-full rounded-md border border-accent/40 bg-bg-primary px-4 py-2 font-body text-text-primary placeholder:text-text-primary/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent transition-colors disabled:opacity-60"
            placeholder="••••••••"
          />
        </div>

        {error !== null && (
          <p
            role="alert"
            aria-live="assertive"
            className="font-body text-sm text-red-400"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={disabled}
          className="w-full rounded-md bg-accent px-8 py-3 font-body font-semibold text-bg-primary transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
