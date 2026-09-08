import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

/** Valor expuesto por el Auth_Context (Req 2). */
export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Hook para consumir el Auth_Context.
 * Lanza un error descriptivo si se usa fuera del AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
        'Wrap your component tree with <AuthProvider>.',
    );
  }
  return context;
}

interface AuthProviderProps {
  readonly children: ReactNode;
}

/**
 * Provider de autenticación. Se suscribe a `onAuthStateChanged` para mantener
 * el estado de sesión y expone `login`/`logout`.
 *
 * - `loading` es `true` hasta la primera emisión de `onAuthStateChanged` (Req 2.7).
 * - La persistencia usa el valor por defecto de Firebase (`local`), conservando
 *   la sesión entre recargas (Req 2.8).
 * - No se expone ninguna función de registro público (`signUp`) (Req 2.6).
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      await signInWithEmailAndPassword(auth, email, password);
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    await signOut(auth);
  }, []);

  const value: AuthContextValue = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
