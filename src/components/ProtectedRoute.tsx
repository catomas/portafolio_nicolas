import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  readonly children: ReactNode;
}

/**
 * Guard de rutas del Panel_Admin (Req 3).
 *
 * - Mientras el estado de autenticación se está determinando (`loading`),
 *   muestra un indicador de carga y NO redirige ni renderiza contenido
 *   protegido (Req 3.2).
 * - Una vez resuelto, si no hay usuario autenticado redirige a
 *   `/admin/login` reemplazando la entrada en el historial (Req 3.3).
 * - Si hay un usuario autenticado, renderiza el contenido protegido (Req 3.4).
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Req 3.2: mientras se determina la sesión, mostrar spinner sin decidir aún.
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

  // Req 3.3: visitante no autenticado bajo /admin → redirigir al login.
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Req 3.4: admin autenticado → renderizar el contenido solicitado.
  return <>{children}</>;
}
