/**
 * Hook de Autenticação
 * Kevin Hussein Tattoo Studio
 */

import { useState, useCallback } from 'react';
import { authApi } from '../services/api';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
}

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const checkAuth = useCallback(async () => {
    if (!authApi.isAuthenticated()) {
      setUser(null);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.me();
      if (response.success) {
        setUser(response.data.user);
      } else {
        setUser(null);
        authApi.clearTokens();
      }
    } catch {
      setUser(null);
      authApi.clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
    clearError,
  };
}

export default useAuth;
