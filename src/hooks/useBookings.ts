/**
 * Hook de Agendamentos
 * Kevin Hussein Tattoo Studio
 */

import { useState, useCallback } from 'react';
import { bookingsApi, Booking, BookingFormData } from '../services/api';

interface BookingStats {
  total: number;
  pendentes: number;
  confirmados: number;
  hoje: number;
  semana: number;
  mes: number;
}

interface UseBookingsReturn {
  bookings: Booking[];
  stats: BookingStats | null;
  isLoading: boolean;
  error: string | null;
  fetchBookings: (params?: {
    status?: string;
    type?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchUpcoming: (limit?: number) => Promise<Booking[]>;
  fetchByDate: (date: string) => Promise<Booking[]>;
  getById: (id: string) => Promise<Booking | null>;
  createBooking: (data: BookingFormData) => Promise<Booking | null>;
  updateBooking: (id: string, data: Partial<Booking>) => Promise<Booking | null>;
  updateStatus: (id: string, status: string) => Promise<boolean>;
  deleteBooking: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useBookings(): UseBookingsReturn {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async (params?: {
    status?: string;
    type?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await bookingsApi.list(params);
      if (response.success) {
        setBookings(response.data.bookings);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar agendamentos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await bookingsApi.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }, []);

  const fetchUpcoming = useCallback(async (limit = 10): Promise<Booking[]> => {
    try {
      const response = await bookingsApi.getUpcoming(limit);
      if (response.success) {
        return response.data;
      }
    } catch (err: any) {
      console.error('Erro ao carregar próximos agendamentos:', err);
    }
    return [];
  }, []);

  const fetchByDate = useCallback(async (date: string): Promise<Booking[]> => {
    try {
      const response = await bookingsApi.getByDate(date);
      if (response.success) {
        return response.data;
      }
    } catch (err: any) {
      console.error('Erro ao carregar agendamentos por data:', err);
    }
    return [];
  }, []);

  const getById = useCallback(async (id: string): Promise<Booking | null> => {
    setIsLoading(true);
    try {
      const response = await bookingsApi.getById(id);
      if (response.success) {
        return response.data;
      }
    } catch (err: any) {
      setError(err.message || 'Agendamento não encontrado');
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  const createBooking = useCallback(async (data: BookingFormData): Promise<Booking | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await bookingsApi.create(data);
      if (response.success) {
        // Adicionar à lista local
        setBookings(prev => [response.data, ...prev]);
        return response.data;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar agendamento');
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  const updateBooking = useCallback(async (id: string, data: Partial<Booking>): Promise<Booking | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await bookingsApi.update(id, data);
      if (response.success) {
        // Atualizar na lista local
        setBookings(prev => prev.map(b => b.id === id ? response.data : b));
        return response.data;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar agendamento');
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  const updateStatus = useCallback(async (id: string, status: string): Promise<boolean> => {
    try {
      const response = await bookingsApi.updateStatus(id, status);
      if (response.success) {
        setBookings(prev => prev.map(b => b.id === id ? response.data : b));
        return true;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar status');
    }
    return false;
  }, []);

  const deleteBooking = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await bookingsApi.delete(id);
      if (response.success) {
        setBookings(prev => prev.filter(b => b.id !== id));
        return true;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao remover agendamento');
    }
    return false;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    bookings,
    stats,
    isLoading,
    error,
    fetchBookings,
    fetchStats,
    fetchUpcoming,
    fetchByDate,
    getById,
    createBooking,
    updateBooking,
    updateStatus,
    deleteBooking,
    clearError,
  };
}

export default useBookings;
