import { Routes, Route } from 'react-router-dom';
import PublicSite from './pages/PublicSite';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/ProtectedRoute';
import { SiteDataProvider } from './contexts/SiteDataContext';

/**
 * Enrutamiento del Sitio (Req 3).
 *
 * Se asume que `App` está envuelto por `BrowserRouter` + `AuthProvider`
 * (ver `main.tsx`), de modo que el estado de autenticación está disponible
 * para todas las rutas (Req 3.1).
 *
 * Rutas:
 * - `/`            → Sitio_Publico con su layout de la Fase 1, envuelto en
 *                    PaletteProvider + SiteDataProvider (Req 3.7).
 * - `/admin/login` → LoginPage (Req 2, 3.5).
 * - `/admin/*`     → ProtectedRoute que envuelve el Panel_Admin (Req 3.3, 3.4,
 *                    3.6). El comodín `*` protege cualquier subruta del panel.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicSite />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <SiteDataProvider>
              <AdminPage />
            </SiteDataProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
