import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { FeedbackKind } from '../components/admin/types';
import GalleryEditor from '../components/admin/GalleryEditor';
import CategoriesEditor from '../components/admin/CategoriesEditor';
import HeroForm from '../components/admin/HeroForm';
import AboutForm from '../components/admin/AboutForm';
import BrandForm from '../components/admin/BrandForm';
import ContactForm from '../components/admin/ContactForm';
import SectionTitlesForm from '../components/admin/SectionTitlesForm';

/** Pestañas disponibles en el Panel_Admin (Req 5.1, 6.1, 7.1, 8.1, 9.1, 10.1, 11.1, 15.1). */
type AdminTab =
  | 'galeria'
  | 'categorias'
  | 'hero'
  | 'about'
  | 'marcas'
  | 'contacto'
  | 'secciones';

/** Definición de cada pestaña: id, etiqueta visible. */
const TABS: ReadonlyArray<{ id: AdminTab; label: string }> = [
  { id: 'galeria', label: 'Galería' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'hero', label: 'Hero' },
  { id: 'about', label: 'About' },
  { id: 'marcas', label: 'Marcas' },
  { id: 'contacto', label: 'Contacto' },
  { id: 'secciones', label: 'Secciones' },
];

/** Feedback a nivel de página con auto-dismiss (Req 5.8/5.9, 6.8/6.9, ...). */
interface Feedback {
  kind: FeedbackKind;
  message: string;
}

/** Milisegundos tras los cuales el banner de feedback se limpia solo. */
const FEEDBACK_TIMEOUT_MS = 4000;

/**
 * AdminPage — Panel_Admin (Req 2.4, 2.5, 5.1, 6.1, 7.1, 8.1, 9.1, 10.1, 11.1).
 *
 * Dashboard con pestañas (`galeria | categorias | hero | about | marcas |
 * contacto`). La pestaña "Galería" unifica la gestión de fotos y los estilos
 * de galería en un único editor (Req 15.1). Mantiene:
 * - El tab activo (estado local).
 * - Un banner de feedback `success`/`error` con auto-dismiss (~4 s).
 *
 * El header muestra el `user.email` (de `useAuth()`) y un botón "Cerrar sesión"
 * que llama a `logout()` y redirige a `/admin/login` (Req 2.4, 2.5).
 *
 * Cada tab renderiza su formulario de `src/components/admin/`, al que se le
 * pasa `onFeedback(kind, message)` para reportar éxito/error al banner. Los
 * formularios completos se implementan en las tareas 16.2–16.8; mientras tanto
 * existen stubs que respetan el mismo contrato (`AdminFormProps`).
 *
 * El Panel_Admin se renderiza SIN el layout del Sitio_Publico (Req 3.6).
 */
export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>('galeria');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Callback compartido que reciben los formularios para reportar el resultado
  // de sus operaciones. Reinicia el temporizador de auto-dismiss en cada aviso.
  const handleFeedback = useCallback(
    (kind: FeedbackKind, message: string) => {
      setFeedback({ kind, message });
      if (feedbackTimer.current !== null) {
        clearTimeout(feedbackTimer.current);
      }
      feedbackTimer.current = setTimeout(() => {
        setFeedback(null);
        feedbackTimer.current = null;
      }, FEEDBACK_TIMEOUT_MS);
    },
    [],
  );

  // Limpia el temporizador pendiente al desmontar para evitar fugas.
  useEffect(() => {
    return () => {
      if (feedbackTimer.current !== null) {
        clearTimeout(feedbackTimer.current);
      }
    };
  }, []);

  // Req 2.4/2.5: cerrar sesión y redirigir a la página de login del panel.
  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  }, [logout, navigate]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'galeria':
        return <GalleryEditor onFeedback={handleFeedback} />;
      case 'categorias':
        return <CategoriesEditor onFeedback={handleFeedback} />;
      case 'hero':
        return <HeroForm onFeedback={handleFeedback} />;
      case 'about':
        return <AboutForm onFeedback={handleFeedback} />;
      case 'marcas':
        return <BrandForm onFeedback={handleFeedback} />;
      case 'contacto':
        return <ContactForm onFeedback={handleFeedback} />;
      case 'secciones':
        return <SectionTitlesForm onFeedback={handleFeedback} />;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-accent/30 bg-bg-secondary px-6 py-4">
        <h1 className="font-display text-xl font-bold text-text-primary">
          Panel de administración
        </h1>
        <div className="flex items-center gap-4">
          {user?.email !== null && user?.email !== undefined && (
            <span className="font-body text-sm text-text-primary/70">
              {user.email}
            </span>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-accent/40 px-4 py-2 font-body text-sm font-semibold text-text-primary transition-colors hover:bg-accent hover:text-bg-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <nav
        aria-label="Secciones del panel"
        className="flex flex-wrap gap-2 border-b border-accent/20 bg-bg-secondary/60 px-6 py-3"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setActiveTab(tab.id)}
              className={
                'rounded-md px-4 py-2 font-body text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent ' +
                (isActive
                  ? 'bg-accent text-bg-primary'
                  : 'text-text-primary/70 hover:bg-accent/10 hover:text-text-primary')
              }
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {feedback !== null && (
        <div
          role="alert"
          aria-live="assertive"
          className={
            'mx-6 mt-4 rounded-md border px-4 py-3 font-body text-sm ' +
            (feedback.kind === 'success'
              ? 'border-green-500/40 bg-green-500/10 text-green-400'
              : 'border-red-500/40 bg-red-500/10 text-red-400')
          }
        >
          {feedback.message}
        </div>
      )}

      <main className="px-6 py-6">{renderActiveTab()}</main>
    </div>
  );
}
