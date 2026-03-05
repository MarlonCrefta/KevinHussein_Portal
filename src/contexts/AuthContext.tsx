/**
 * Contexto de Autenticação
 * Kevin Hussein Tattoo Studio
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { authApi } from '../services/api';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar autenticação no carregamento
  useEffect(() => {
    const checkAuth = async () => {
      if (!authApi.isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.me();
        if (response.success) {
          setUser(response.data.user);
        } else {
          authApi.clearTokens();
        }
      } catch {
        authApi.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(username, password);
      
      if (response.success) {
        setUser(response.data.user);
        return true;
      }
      
      setError('Erro ao fazer login');
      return false;
    } catch (err: any) {
      setError(err.message || 'Usuário ou senha inválidos');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    
    try {
      await authApi.logout();
    } catch {
      // Ignorar erros de logout
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}

export default AuthContext;
