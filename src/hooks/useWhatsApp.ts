/**
 * Hook de WhatsApp
 * Kevin Hussein Tattoo Studio
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { whatsappApi } from '../services/api';

interface ClientInfo {
  name: string;
  phone: string;
}

interface UseWhatsAppReturn {
  isConnected: boolean;
  isConnecting: boolean;
  qrCode: string | null;
  clientInfo: ClientInfo | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (phone: string, message: string) => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}

interface WhatsAppStatusData {
  isReady: boolean;
  isConnecting?: boolean;
  qrCode: string | null;
  clientInfo: ClientInfo | null;
}

export function useWhatsApp(): UseWhatsAppReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const pollingRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const response = await whatsappApi.getStatus();
      if (response.success) {
        const data = response.data as WhatsAppStatusData;
        setIsConnected(data.isReady);
        setQrCode(data.qrCode);
        setClientInfo(data.clientInfo);
        setIsConnecting(!!data.isConnecting && !data.isReady);
        
        // Parar polling se conectou
        if (data.isReady) {
          stopPolling();
          setIsConnecting(false);
        }
      }
    } catch (err: any) {
      console.error('Erro ao verificar status WhatsApp:', err);
    }
  }, [stopPolling]);

  // After refreshStatus is defined, refresh startPolling reference
  const startPollingStable = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = window.setInterval(() => {
      refreshStatus();
    }, 2000);
  }, [refreshStatus]);

  const connect = useCallback(async () => {
    if (isConnecting || isConnected) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      stopPolling();

      const response = await whatsappApi.connect();
      
      if (response.success) {
        // Iniciar polling para verificar QR Code e conexão
        startPollingStable();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar WhatsApp');
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected, startPollingStable, stopPolling]);

  const disconnect = useCallback(async () => {
    try {
      // Parar polling
      stopPolling();

      const response = await whatsappApi.disconnect();
      
      if (response.success) {
        setIsConnected(false);
        setQrCode(null);
        setClientInfo(null);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao desconectar WhatsApp');
    }
  }, [stopPolling]);

  const sendMessage = useCallback(async (phone: string, message: string): Promise<boolean> => {
    if (!isConnected) {
      setError('WhatsApp não está conectado');
      return false;
    }

    try {
      const response = await whatsappApi.sendMessage(phone, message);
      return response.success;
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar mensagem');
      return false;
    }
  }, [isConnected]);

  // Verificar status inicial
  useEffect(() => {
    refreshStatus();

    // Manter polling ativo enquanto não estiver conectado,
    // inclusive quando conexão é iniciada pelo backend (autoConnect).
    startPollingStable();

    // Cleanup
    return () => {
      stopPolling();
    };
  }, [refreshStatus, startPollingStable, stopPolling]);

  return {
    isConnected,
    isConnecting,
    qrCode,
    clientInfo,
    error,
    connect,
    disconnect,
    sendMessage,
    refreshStatus,
  };
}

export default useWhatsApp;
