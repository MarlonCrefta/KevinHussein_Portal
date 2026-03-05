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

export function useWhatsApp(): UseWhatsAppReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const pollingRef = useRef<number | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const response = await whatsappApi.getStatus();
      if (response.success) {
        setIsConnected(response.data.isReady);
        setQrCode(response.data.qrCode);
        setClientInfo(response.data.clientInfo);
        
        // Parar polling se conectou
        if (response.data.isReady && pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          setIsConnecting(false);
        }
      }
    } catch (err: any) {
      console.error('Erro ao verificar status WhatsApp:', err);
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const response = await whatsappApi.connect();
      
      if (response.success) {
        // Iniciar polling para verificar QR Code e conexão
        pollingRef.current = window.setInterval(() => {
          refreshStatus();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar WhatsApp');
      setIsConnecting(false);
    }
  }, [refreshStatus]);

  const disconnect = useCallback(async () => {
    try {
      // Parar polling
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }

      const response = await whatsappApi.disconnect();
      
      if (response.success) {
        setIsConnected(false);
        setQrCode(null);
        setClientInfo(null);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao desconectar WhatsApp');
    }
  }, []);

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

    // Cleanup
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [refreshStatus]);

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
