import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'

// Árbol de providers de la Fase 2 (Req 3.1):
// BrowserRouter → AuthProvider → App (Routes). El estado de autenticación queda
// disponible para todas las rutas, incluidas ProtectedRoute y LoginPage.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
