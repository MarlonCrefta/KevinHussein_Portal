/**
 * Hook de Slots (Vagas)
 * Kevin Hussein Tattoo Studio
 */

import { useState, useCallback } from 'react';
import { slotsApi, Slot } from '../services/api';

interface UseSlotsReturn {
  slots: Slot[];
  isLoading: boolean;
  error: string | null;
  fetchSlots: (params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    available?: boolean;
  }) => Promise<void>;
  fetchAvailable: (date: string, type?: string) => Promise<Slot[]>;
  fetchByDate: (date: string) => Promise<Slot[]>;
  createSlot: (data: { date: string; time: string; type: string; duration?: number }) => Promise<Slot | null>;
  createMany: (slots: Array<{ date: string; time: string; type: string; duration?: number }>) => Promise<number>;
  deleteSlot: (id: string) => Promise<boolean>;
  deleteByDate: (date: string) => Promise<boolean>;
  clearError: () => void;
}

export function useSlots(): UseSlotsReturn {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async (params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    available?: boolean;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await slotsApi.list(params);
      if (response.success) {
        setSlots(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar vagas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAvailable = useCallback(async (date: string, type?: string): Promise<Slot[]> => {
    try {
      const response = await slotsApi.getAvailable(date, type);
      if (response.success) {
        return response.data;
      }
    } catch (err: any) {
      console.error('Erro ao carregar vagas disponíveis:', err);
    }
    return [];
  }, []);

  const fetchByDate = useCallback(async (date: string): Promise<Slot[]> => {
    setIsLoading(true);
    try {
      const response = await slotsApi.getByDate(date);
      if (response.success) {
        setSlots(response.data);
        return response.data;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar vagas');
    } finally {
      setIsLoading(false);
    }
    return [];
  }, []);

  const createSlot = useCallback(async (data: { date: string; time: string; type: string; duration?: number }): Promise<Slot | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await slotsApi.create(data);
      if (response.success) {
        setSlots(prev => [...prev, response.data].sort((a, b) => a.time.localeCompare(b.time)));
        return response.data;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar vaga');
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  const createMany = useCallback(async (slotsData: Array<{ date: string; time: string; type: string; duration?: number }>): Promise<number> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await slotsApi.createMany(slotsData);
      if (response.success) {
        return response.count;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar vagas');
    } finally {
      setIsLoading(false);
    }
    return 0;
  }, []);

  const deleteSlot = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await slotsApi.delete(id);
      if (response.success) {
        setSlots(prev => prev.filter(s => s.id !== id));
        return true;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao remover vaga');
    }
    return false;
  }, []);

  const deleteByDate = useCallback(async (date: string): Promise<boolean> => {
    try {
      const response = await slotsApi.deleteByDate(date);
      if (response.success) {
        setSlots(prev => prev.filter(s => s.date !== date));
        return true;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao remover vagas');
    }
    return false;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    slots,
    isLoading,
    error,
    fetchSlots,
    fetchAvailable,
    fetchByDate,
    createSlot,
    createMany,
    deleteSlot,
    deleteByDate,
    clearError,
  };
}

export default useSlots;
